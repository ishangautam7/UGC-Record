"use client";

import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import styles from '../shared.module.css';

interface User {
    id: string;
    name: string;
    email: string;
    department: string;
    is_active: boolean;
    roles: string[];
    college_id: string;
    college_name: string;
    created_at: string;
}

interface Role {
    id: string;
    name: string;
}

interface College {
    id: string;
    name: string;
    code: string;
}

export default function UsersPage() {
    const { hasRole, user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [colleges, setColleges] = useState<College[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        department: '',
        roleId: '',
        college_id: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchColleges();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data);
        } catch (err) {
            console.error('Failed to fetch roles:', err);
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

    const getAvailableRoles = () => {
        if (hasRole('ADMIN')) {
            return roles.filter(r => ['DEPARTMENT_HEAD', 'AUDITOR', 'RESEARCHER'].includes(r.name));
        }
        if (hasRole('DEPARTMENT_HEAD')) {
            return roles.filter(r => r.name === 'RESEARCHER');
        }
        return [];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/auth/users', formData);
            fetchUsers();
            resetForm();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to create user');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setFormData({ name: '', email: '', password: '', department: '', roleId: '', college_id: '' });
    };

    const handleToggleStatus = async (id: string) => {
        try {
            await api.patch(`/users/${id}/toggle-status`);
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to toggle status');
        }
    };

    return (
        <ProtectedRoute requiredRoles={['ADMIN', 'DEPARTMENT_HEAD']}>
            <div className={styles.page}>
                <header className={styles.header}>
                    <div>
                        <h1>👥 Users</h1>
                        <p>
                            {hasRole('ADMIN')
                                ? 'Create Department Heads, Auditors, and Researchers'
                                : 'Create Researcher accounts for your college'}
                        </p>
                    </div>
                    <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                        + Create User
                    </button>
                </header>

                {showForm && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>Create New User</h2>
                            <form onSubmit={handleSubmit}>
                                <div className={styles.formGroup}>
                                    <label>Full Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Password *</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                {hasRole('ADMIN') && (
                                    <div className={styles.formGroup}>
                                        <label>College *</label>
                                        <select
                                            value={formData.college_id}
                                            onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select College</option>
                                            {colleges.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className={styles.formGroup}>
                                    <label>Role *</label>
                                    <select
                                        value={formData.roleId}
                                        onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Role</option>
                                        {getAvailableRoles().map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Department (optional)</label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="e.g. Computer Science"
                                    />
                                </div>
                                <div className={styles.formActions}>
                                    <button type="button" onClick={resetForm} className={styles.cancelBtn}>Cancel</button>
                                    <button type="submit" className={styles.submitBtn}>Create User</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className={styles.loading}>Loading users...</div>
                ) : users.length === 0 ? (
                    <div className={styles.empty}>No users found.</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>College</th>
                                <th>Roles</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.college_name || 'Not assigned'}</td>
                                    <td>
                                        {user.roles?.filter(r => r).map(role => (
                                            <span key={role} className={styles.badge}>{role}</span>
                                        ))}
                                    </td>
                                    <td>
                                        <span className={user.is_active ? styles.active : styles.inactive}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        {hasRole('ADMIN') && user.id !== currentUser?.id && (
                                            <button
                                                onClick={() => handleToggleStatus(user.id)}
                                                className={user.is_active ? styles.deactivateBtn : styles.activateBtn}
                                            >
                                                {user.is_active ? '🚫' : '✅'}
                                            </button>
                                        )}
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
