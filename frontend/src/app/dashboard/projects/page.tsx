"use client";

import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import styles from '../shared.module.css';

interface Project {
    id: string;
    title: string;
    slug: string;
    abstract: string;
    grant_amount: number;
    duration: string;
    status: string;
    department_name: string;
    expense_count: number;
    total_expenses: number;
    created_at: string;
}

export default function ProjectsPage() {
    const { hasAnyRole, hasRole } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Project | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        abstract: '',
        grant_amount: '',
        duration: '',
        dept_id: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        fetchProjects();
        fetchDepartments();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments');
            setDepartments(res.data);
        } catch (err) {
            console.error('Failed to fetch departments:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                grant_amount: parseFloat(formData.grant_amount) || 0
            };

            if (editing) {
                await api.put(`/projects/${editing.id}`, payload);
            } else {
                await api.post('/projects', payload);
            }
            fetchProjects();
            resetForm();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await api.patch(`/projects/${id}/status`, { status });
            fetchProjects();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;
        try {
            await api.delete(`/projects/${id}`);
            fetchProjects();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete project');
        }
    };

    const startEdit = (project: Project) => {
        setEditing(project);
        setFormData({
            title: project.title,
            abstract: project.abstract || '',
            grant_amount: project.grant_amount?.toString() || '',
            duration: project.duration || '',
            dept_id: '',
            start_date: '',
            end_date: ''
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditing(null);
        setFormData({ title: '', abstract: '', grant_amount: '', duration: '', dept_id: '', start_date: '', end_date: '' });
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            DRAFT: '#9ca3af',
            SUBMITTED: '#6366f1',
            PENDING: '#f59e0b',
            APPROVED: '#10b981',
            REJECTED: '#ef4444',
            AUDITED: '#8b5cf6',
            ONGOING: '#3b82f6',
            COMPLETED: '#059669'
        };
        return colors[status] || '#6b7280';
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1>📁 Projects</h1>
                    <p>Manage research projects</p>
                </div>
                {hasAnyRole('RESEARCHER', 'DEPARTMENT_HEAD', 'ADMIN') && (
                    <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                        + New Project
                    </button>
                )}
            </header>

            {showForm && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>{editing ? 'Edit Project' : 'New Project'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Project Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            {!editing && (
                                <div className={styles.formGroup}>
                                    <label>Department *</label>
                                    <select
                                        value={formData.dept_id}
                                        onChange={(e) => setFormData({ ...formData, dept_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className={styles.formGroup}>
                                <label>Abstract</label>
                                <textarea
                                    value={formData.abstract}
                                    onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                                    rows={4}
                                />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Grant Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.grant_amount}
                                        onChange={(e) => setFormData({ ...formData, grant_amount: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Duration</label>
                                    <input
                                        type="text"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        placeholder="e.g. 2 years"
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
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
                <div className={styles.loading}>Loading projects...</div>
            ) : projects.length === 0 ? (
                <div className={styles.empty}>No projects found. Create your first project!</div>
            ) : (
                <div className={styles.grid}>
                    {projects.map(project => (
                        <div key={project.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3>{project.title}</h3>
                                <span
                                    className={styles.badge}
                                    style={{ backgroundColor: getStatusColor(project.status) }}
                                >
                                    {project.status}
                                </span>
                            </div>
                            <p className={styles.cardDesc}>{project.abstract || 'No description'}</p>
                            <div className={styles.cardMeta}>
                                <span>🏢 {project.department_name}</span>
                                <span>💰 ₹{project.grant_amount?.toLocaleString() || 0}</span>
                                <span>📊 {project.expense_count} expenses (₹{project.total_expenses?.toLocaleString() || 0})</span>
                            </div>
                            <div className={styles.cardActions}>
                                {hasAnyRole('DEPARTMENT_HEAD', 'ADMIN') && (
                                    <select
                                        value={project.status}
                                        onChange={(e) => handleStatusChange(project.id, e.target.value)}
                                        className={styles.statusSelect}
                                    >
                                        <option value="DRAFT">DRAFT</option>
                                        <option value="SUBMITTED">SUBMITTED</option>
                                        <option value="PENDING">PENDING</option>
                                        <option value="APPROVED">APPROVED</option>
                                        <option value="REJECTED">REJECTED</option>
                                        <option value="AUDITED">AUDITED</option>
                                        <option value="ONGOING">ONGOING</option>
                                        <option value="COMPLETED">COMPLETED</option>
                                    </select>
                                )}
                                <button onClick={() => startEdit(project)} className={styles.editBtn}>✏️ Edit</button>
                                {hasRole('ADMIN') && (
                                    <button onClick={() => handleDelete(project.id)} className={styles.deleteBtn}>🗑️ Delete</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
