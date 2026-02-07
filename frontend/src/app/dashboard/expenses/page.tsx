"use client";

import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import styles from '../shared.module.css';

interface Expense {
    id: string;
    project_id: string;
    project_title: string;
    filed_by_name: string;
    bill_date: string;
    category: string;
    amount: number;
    description: string;
    status: string;
    created_at: string;
}

export default function ExpensesPage() {
    const { hasAnyRole } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        project_id: '',
        bill_date: '',
        category: '',
        amount: '',
        description: ''
    });

    useEffect(() => {
        fetchExpenses();
        fetchProjects();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/expenses');
            setExpenses(res.data);
        } catch (err) {
            console.error('Failed to fetch expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/expenses', {
                ...formData,
                amount: parseFloat(formData.amount)
            });
            fetchExpenses();
            resetForm();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to create expense');
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await api.patch(`/expenses/${id}/status`, { status });
            fetchExpenses();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update status');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setFormData({ project_id: '', bill_date: '', category: '', amount: '', description: '' });
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: '#f59e0b',
            APPROVED: '#10b981',
            REJECTED: '#ef4444'
        };
        return colors[status] || '#6b7280';
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1>💰 Expenses</h1>
                    <p>Track and manage project expenses</p>
                </div>
                {hasAnyRole('ADMIN', 'RESEARCHER', 'DEPARTMENT_HEAD') && (
                    <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                        + File Expense
                    </button>
                )}
            </header>

            {showForm && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>File New Expense</h2>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Project</label>
                                <select
                                    value={formData.project_id}
                                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Project</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Bill Date</label>
                                    <input
                                        type="date"
                                        value={formData.bill_date}
                                        onChange={(e) => setFormData({ ...formData, bill_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Travel">Travel</option>
                                    <option value="Consumables">Consumables</option>
                                    <option value="Services">Services</option>
                                    <option value="Salary">Salary</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className={styles.formActions}>
                                <button type="button" onClick={resetForm} className={styles.cancelBtn}>Cancel</button>
                                <button type="submit" className={styles.submitBtn}>Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className={styles.loading}>Loading expenses...</div>
            ) : expenses.length === 0 ? (
                <div className={styles.empty}>No expenses found.</div>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Filed By</th>
                            <th>Date</th>
                            <th>Status</th>
                            {hasAnyRole('ADMIN', 'DEPARTMENT_HEAD') && <th>Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(expense => (
                            <tr key={expense.id}>
                                <td>{expense.project_title}</td>
                                <td>{expense.category}</td>
                                <td>₹{expense.amount?.toLocaleString()}</td>
                                <td>{expense.filed_by_name}</td>
                                <td>{new Date(expense.bill_date).toLocaleDateString()}</td>
                                <td>
                                    <span
                                        className={styles.badge}
                                        style={{ backgroundColor: getStatusColor(expense.status) }}
                                    >
                                        {expense.status}
                                    </span>
                                </td>
                                {hasAnyRole('ADMIN', 'DEPARTMENT_HEAD') && (
                                    <td>
                                        <select
                                            value={expense.status}
                                            onChange={(e) => handleStatusChange(expense.id, e.target.value)}
                                            className={styles.statusSelect}
                                        >
                                            <option value="PENDING">PENDING</option>
                                            <option value="APPROVED">APPROVED</option>
                                            <option value="REJECTED">REJECTED</option>
                                        </select>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
