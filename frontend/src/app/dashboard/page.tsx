"use client";

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import styles from './dashboard.module.css';

interface Stats {
    projects: { total: number; pending: number; approved: number; in_progress: number; completed: number };
    expenses: { total: number; pending: number; approved: number; total_approved_amount: number };
    users: number;
    departments: number;
}

export default function DashboardPage() {
    const { user, hasRole, hasAnyRole } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentItems, setRecentItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [projectStats, expenseStats, usersRes, deptsRes] = await Promise.all([
                api.get('/projects/stats'),
                api.get('/expenses/stats'),
                api.get('/users'),
                api.get('/departments')
            ]);

            setStats({
                projects: projectStats.data,
                expenses: expenseStats.data,
                users: usersRes.data.length,
                departments: deptsRes.data.length
            });

            const projectsRes = await api.get('/projects');
            setRecentItems(projectsRes.data.slice(0, 5));
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading dashboard...</div>;
    }

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div>
                    <h1>Welcome, {user?.name}</h1>
                    <p className={styles.roleDisplay}>
                        {user?.roles?.filter(r => r).map(role => (
                            <span key={role} className={styles.roleBadge}>{role}</span>
                        ))}
                    </p>
                </div>
            </header>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>📁</div>
                    <div className={styles.statContent}>
                        <h3>{stats?.projects.total || 0}</h3>
                        <p>Total Projects</p>
                        <div className={styles.statBreakdown}>
                            <span className={styles.pending}>{stats?.projects.pending || 0} pending</span>
                            <span className={styles.approved}>{stats?.projects.approved || 0} approved</span>
                        </div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>💰</div>
                    <div className={styles.statContent}>
                        <h3>₹{(stats?.expenses.total_approved_amount || 0).toLocaleString()}</h3>
                        <p>Approved Expenses</p>
                        <div className={styles.statBreakdown}>
                            <span className={styles.pending}>{stats?.expenses.pending || 0} pending</span>
                            <span className={styles.approved}>{stats?.expenses.approved || 0} approved</span>
                        </div>
                    </div>
                </div>

                {hasAnyRole('ADMIN', 'DEPARTMENT_HEAD') && (
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>�</div>
                        <div className={styles.statContent}>
                            <h3>{stats?.users || 0}</h3>
                            <p>Users</p>
                        </div>
                    </div>
                )}

                {hasRole('ADMIN') && (
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>🏢</div>
                        <div className={styles.statContent}>
                            <h3>{stats?.departments || 0}</h3>
                            <p>Departments</p>
                        </div>
                    </div>
                )}
            </div>

            <section className={styles.section}>
                <h2>Recent Projects</h2>
                {recentItems.length === 0 ? (
                    <p className={styles.empty}>No projects yet</p>
                ) : (
                    <div className={styles.recentList}>
                        {recentItems.map(project => (
                            <div key={project.id} className={styles.recentItem}>
                                <div className={styles.recentInfo}>
                                    <h4>{project.title}</h4>
                                    <span className={styles.dept}>{project.department_name}</span>
                                </div>
                                <span
                                    className={styles.status}
                                    data-status={project.status}
                                >
                                    {project.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
