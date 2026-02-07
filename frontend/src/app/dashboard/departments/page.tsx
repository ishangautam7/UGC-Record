"use client";

import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import ProtectedRoute from '../../../components/ProtectedRoute';
import styles from '../shared.module.css';

interface Department {
    id: string;
    name: string;
    code: string;
    college_id: string;
    college_name: string;
    created_at: string;
}

interface College {
    id: string;
    name: string;
    code: string;
}

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [colleges, setColleges] = useState<College[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Department | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        college_id: ''
    });

    useEffect(() => {
        fetchDepartments();
        fetchColleges();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments');
            setDepartments(res.data);
        } catch (err) {
            console.error('Failed to fetch departments:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchColleges = async () => {
        try {
            const res = await api.get('/colleges');
            setColleges(res.data);
        } catch (err) {
            console.error('Failed to fetch colleges:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/departments/${editing.id}`, formData);
            } else {
                await api.post('/departments', formData);
            }
            fetchDepartments();
            resetForm();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this department?')) return;
        try {
            await api.delete(`/departments/${id}`);
            fetchDepartments();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete');
        }
    };

    const startEdit = (dept: Department) => {
        setEditing(dept);
        setFormData({
            name: dept.name,
            code: dept.code,
            college_id: dept.college_id || ''
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditing(null);
        setFormData({ name: '', code: '', college_id: '' });
    };

    return (
        <ProtectedRoute requiredRoles={['ADMIN']}>
            <div className={styles.page}>
                <header className={styles.header}>
                    <div>
                        <h1>🏢 Departments</h1>
                        <p>Manage departments within colleges</p>
                    </div>
                    <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                        + Add Department
                    </button>
                </header>

                {showForm && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>{editing ? 'Edit Department' : 'New Department'}</h2>
                            <form onSubmit={handleSubmit}>
                                <div className={styles.formGroup}>
                                    <label>College *</label>
                                    <select
                                        value={formData.college_id}
                                        onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select College</option>
                                        {colleges.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Department Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Computer Science"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Department Code *</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="CS"
                                        required
                                    />
                                </div>
                                <div className={styles.formActions}>
                                    <button type="button" onClick={resetForm} className={styles.cancelBtn}>Cancel</button>
                                    <button type="submit" className={styles.submitBtn}>
                                        {editing ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className={styles.loading}>Loading departments...</div>
                ) : departments.length === 0 ? (
                    <div className={styles.empty}>No departments found. Create a college first, then add departments!</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Code</th>
                                <th>College</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map(dept => (
                                <tr key={dept.id}>
                                    <td>{dept.name}</td>
                                    <td><span className={styles.badge}>{dept.code}</span></td>
                                    <td>{dept.college_name || 'Not assigned'}</td>
                                    <td>
                                        <button onClick={() => startEdit(dept)} className={styles.editBtn}>✏️</button>
                                        <button onClick={() => handleDelete(dept.id)} className={styles.deleteBtn}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </ProtectedRoute>
    );
}
