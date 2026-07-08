import { Injectable, NgZone } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
} from 'firebase/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  uid: string;
  name: string;
  role: 'member' | 'manager';
}

export interface Expense {
  id?: string;
  userId: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app = initializeApp(environment.firebase);
  private auth = getAuth(this.app);
  private db = getFirestore(this.app);

  public user$ = new BehaviorSubject<FirebaseUser | null>(null);
  public userProfile$ = new BehaviorSubject<UserProfile | null>(null);
  public loading$ = new BehaviorSubject<boolean>(true);

  constructor(private ngZone: NgZone) {
    onAuthStateChanged(this.auth, async (user) => {
      this.ngZone.run(async () => {
        this.user$.next(user);
        if (user) {
          this.loading$.next(true);
          try {
            const profileDoc = await this.runInZone(getDoc(doc(this.db, 'users', user.uid)));
            if (profileDoc.exists()) {
              const data = profileDoc.data();
              this.userProfile$.next({
                uid: data['uid'] || user.uid,
                name: data['name'] || user.email?.split('@')[0] || 'User',
                role: data['role'] || 'member'
              } as UserProfile);
            } else {
              // Safe fallback if user profile doesn't exist in Firestore
              const defaultProfile: UserProfile = {
                uid: user.uid,
                name: user.email?.split('@')[0] || 'User',
                role: 'member'
              };
              await this.runInZone(setDoc(doc(this.db, 'users', user.uid), defaultProfile));
              this.userProfile$.next(defaultProfile);
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            this.userProfile$.next(null);
          } finally {
            this.loading$.next(false);
          }
        } else {
          this.userProfile$.next(null);
          this.loading$.next(false);
        }
      });
    });
  }

  private runInZone<T>(promise: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      promise.then(
        val => this.ngZone.run(() => resolve(val)),
        err => this.ngZone.run(() => reject(err))
      );
    });
  }

  signIn(email: string, password: string) {
    return this.runInZone(signInWithEmailAndPassword(this.auth, email, password));
  }

  signOut() {
    return this.runInZone(signOut(this.auth));
  }

  getUsers(): Observable<UserProfile[]> {
    return new Observable<UserProfile[]>(observer => {
      const usersCol = collection(this.db, 'users');
      const unsubscribe = onSnapshot(usersCol, (snapshot) => {
        this.ngZone.run(() => {
          const profiles: UserProfile[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            profiles.push({
              uid: docSnap.id,
              name: data['name'] || 'User',
              role: data['role'] || 'member'
            } as UserProfile);
          });
          observer.next(profiles);
        });
      }, (error) => {
        this.ngZone.run(() => {
          observer.error(error);
        });
      });

      return () => unsubscribe();
    });
  }

  getExpenses(userId: string, role: 'member' | 'manager'): Observable<Expense[]> {
    return new Observable<Expense[]>(observer => {
      const expensesCol = collection(this.db, 'expenses');
      let q = query(expensesCol, orderBy('date', 'desc'));
      
      if (role === 'member') {
        q = query(expensesCol, where('userId', '==', userId), orderBy('date', 'desc'));
      }
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        this.ngZone.run(() => {
          const expenses: Expense[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            expenses.push({
              id: docSnap.id,
              userId: data['userId'],
              amount: Number(data['amount']),
              category: data['category'],
              date: data['date'],
              note: data['note']
            });
          });
          observer.next(expenses);
        });
      }, (error) => {
        this.ngZone.run(() => {
          observer.error(error);
        });
      });

      return () => unsubscribe();
    });
  }

  createExpense(expense: Omit<Expense, 'id'>) {
    const expensesCol = collection(this.db, 'expenses');
    return this.runInZone(addDoc(expensesCol, expense));
  }

  updateExpense(id: string, expense: Partial<Expense>) {
    const expenseDocRef = doc(this.db, 'expenses', id);
    return this.runInZone(updateDoc(expenseDocRef, expense));
  }

  deleteExpense(id: string) {
    const expenseDocRef = doc(this.db, 'expenses', id);
    return this.runInZone(deleteDoc(expenseDocRef));
  }
}
