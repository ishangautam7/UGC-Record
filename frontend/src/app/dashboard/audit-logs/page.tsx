"use client";

import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import ProtectedRoute from '../../../components/ProtectedRoute';
import styles from '../shared.module.css';

interface AuditLog {
    id: string;
    action: string;
    entity: string;
    entity_id: string;
    user_name: string;
    old_value: any;
    new_value: any;
    created_at: string;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const fetchLogs = async () => {
        try {
            const url = filter ? `/audit-logs?entity=${filter}` : '/audit-logs';
            const res = await api.get(url);
            setLogs(res.data);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        const colors: Record<string, string> = {
            CREATE: '#10b981',
            UPDATE: '#3b82f6',
            DELETE: '#ef4444',
            STATUS_CHANGE: '#f59e0b'
        };
        return colors[action] || '#6b7280';
    };

    return (
        <ProtectedRoute requiredRoles={['ADMIN', 'AUDITOR']}>
            <div className={styles.page}>
                <header className={styles.header}>
                    <div>
                        <h1>📋 Audit Logs</h1>
                        <p>System activity and change history</p>
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">All Entities</option>
                        <option value="Project">Projects</option>
                        <option value="Expense">Expenses</option>
                        <option value="User">Users</option>
                        <option value="Department">Departments</option>
                    </select>
                </header>

                {loading ? (
                    <div className={styles.loading}>Loading audit logs...</div>
                ) : logs.length === 0 ? (
                    <div className={styles.empty}>No audit logs found.</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td>{new Date(log.created_at).toLocaleString()}</td>
                                    <td>{log.user_name || 'System'}</td>
                                    <td>
                                        <span
                                            className={styles.badge}
                                            style={{ backgroundColor: getActionColor(log.action) }}
                                        >
                                            {log.action}
                                        </span>
                                    </td>
                                    <td>{log.entity}</td>
                                    <td className={styles.details}>
                                        {log.action === 'STATUS_CHANGE' ? (
                                            <span>{log.old_value} → {log.new_value}</span>
                                        ) : log.action === 'DELETE' ? (
                                            <span className={styles.deleted}>Record deleted</span>
                                        ) : (
                                            <span className={styles.muted}>
                                                {log.new_value ? 'Record modified' : 'Record created'}
                                            </span>
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
