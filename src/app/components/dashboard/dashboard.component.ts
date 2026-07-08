import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService, Expense, UserProfile } from '../../services/firebase.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUserProfile: UserProfile | null = null;
  expenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
  
  categoryTotals: { [key: string]: number } = {};
  categories: string[] = ['Food', 'Travel', 'Equipment', 'Utilities', 'Other'];

  // Filters
  filterCategory = '';
  filterStartDate = '';
  filterEndDate = '';

  // Modals visibility
  showAddModal = false;
  showEditModal = false;

  // New Expense Form Model
  newAmount: number | null = null;
  newCategory = 'Food';
  newDate = '';
  newNote = '';

  // Editing Expense Form Model
  editingExpenseId = '';
  editAmount: number | null = null;
  editCategory = 'Food';
  editDate = '';
  editNote = '';

  private profileSub?: Subscription;
  private expensesSub?: Subscription;
  private usersSub?: Subscription;
  userNames: { [uid: string]: string } = {};

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const today = new Date();
    this.newDate = today.toISOString().split('T')[0];

    this.profileSub = this.firebaseService.userProfile$.subscribe(profile => {
      this.currentUserProfile = profile;
      if (profile) {
        this.loadExpenses(profile.uid, profile.role);
        if (profile.role === 'manager') {
          this.loadUserNames();
        }
      }
      this.cdr.markForCheck();
    });
  }

  loadUserNames() {
    if (this.usersSub) {
      this.usersSub.unsubscribe();
    }
    this.usersSub = this.firebaseService.getUsers().subscribe({
      next: (profiles) => {
        const map: { [uid: string]: string } = {};
        profiles.forEach(p => {
          map[p.uid] = p.name;
        });
        this.userNames = map;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading users:', err);
      }
    });
  }

  ngOnDestroy() {
    if (this.profileSub) this.profileSub.unsubscribe();
    if (this.expensesSub) this.expensesSub.unsubscribe();
    if (this.usersSub) this.usersSub.unsubscribe();
  }

  loadExpenses(userId: string, role: 'member' | 'manager') {
    if (this.expensesSub) {
      this.expensesSub.unsubscribe();
    }
    this.expensesSub = this.firebaseService.getExpenses(userId, role).subscribe({
      next: (data) => {
        this.expenses = data.map(expense => ({
          ...expense,
          date: expense.date ? expense.date.replace(/^60706/, '2026') : ''
        })).sort((a, b) => b.date.localeCompare(a.date));
        this.applyFilters();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading expenses:', err);
      }
    });
  }

  applyFilters() {
    this.filteredExpenses = this.expenses.filter(expense => {
      if (this.filterCategory && expense.category !== this.filterCategory) {
        return false;
      }
      if (this.filterStartDate && expense.date < this.filterStartDate) {
        return false;
      }
      if (this.filterEndDate && expense.date > this.filterEndDate) {
        return false;
      }
      return true;
    });

    this.calculateTotals();
  }

  clearFilters() {
    this.filterCategory = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.applyFilters();
  }

  calculateTotals() {
    const totals: { [key: string]: number } = {};
    this.categories.forEach(cat => totals[cat] = 0);
    
    this.filteredExpenses.forEach(expense => {
      const cat = expense.category;
      if (totals[cat] !== undefined) {
        totals[cat] += expense.amount;
      } else {
        totals[cat] = expense.amount;
      }
    });

    this.categoryTotals = totals;
  }

  async onSignOut() {
    try {
      await this.firebaseService.signOut();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  }

  openAddModal() {
    const today = new Date();
    this.newAmount = null;
    this.newCategory = 'Food';
    this.newDate = today.toISOString().split('T')[0];
    this.newNote = '';
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  async addExpense() {
    if (!this.currentUserProfile) return;
    if (this.currentUserProfile.role === 'manager') {
      return;
    }
    if (this.newAmount === null || this.newAmount <= 0 || !this.newCategory || !this.newDate) {
      alert('Please fill out all required fields with valid data.');
      return;
    }

    const expenseData: Omit<Expense, 'id'> = {
      userId: this.currentUserProfile.uid,
      amount: Number(this.newAmount),
      category: this.newCategory,
      date: this.newDate,
      note: this.newNote
    };

    try {
      await this.firebaseService.createExpense(expenseData);
      this.closeAddModal();
      this.cdr.markForCheck();
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('Failed to add expense.');
      this.cdr.markForCheck();
    }
  }

  openEditModal(expense: Expense) {
    if (!expense.id) return;
    this.editingExpenseId = expense.id;
    this.editAmount = expense.amount;
    this.editCategory = expense.category;
    this.editDate = expense.date;
    this.editNote = expense.note;
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  async updateExpense() {
    if (!this.currentUserProfile) return;
    if (this.currentUserProfile.role === 'manager') {
      return;
    }
    if (!this.editingExpenseId || this.editAmount === null || this.editAmount <= 0 || !this.editCategory || !this.editDate) {
      alert('Please fill out all required fields with valid data.');
      return;
    }

    const updatedData: Partial<Expense> = {
      amount: Number(this.editAmount),
      category: this.editCategory,
      date: this.editDate,
      note: this.editNote
    };

    try {
      await this.firebaseService.updateExpense(this.editingExpenseId, updatedData);
      this.closeEditModal();
      this.cdr.markForCheck();
    } catch (err) {
      console.error('Error updating expense:', err);
      alert('Failed to update expense.');
      this.cdr.markForCheck();
    }
  }

  async deleteExpense(id?: string) {
    if (!id || !this.currentUserProfile) return;
    if (this.currentUserProfile.role === 'manager') {
      return;
    }
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await this.firebaseService.deleteExpense(id);
        this.cdr.markForCheck();
      } catch (err) {
        console.error('Error deleting expense:', err);
        alert('Failed to delete expense.');
        this.cdr.markForCheck();
      }
    }
  }
}
