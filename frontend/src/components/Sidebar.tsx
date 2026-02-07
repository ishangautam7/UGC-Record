"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import styles from './Sidebar.module.css';

interface NavItem {
    name: string;
    href: string;
    icon: string;
    roles?: string[];
}

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Projects', href: '/dashboard/projects', icon: '📁' },
    { name: 'Expenses', href: '/dashboard/expenses', icon: '💰' },
    { name: 'Researchers', href: '/dashboard/researchers', icon: '👨‍🔬', roles: ['ADMIN', 'DEPARTMENT_HEAD'] },
    { name: 'Users', href: '/dashboard/users', icon: '👥', roles: ['ADMIN', 'DEPARTMENT_HEAD'] },
    { name: 'Departments', href: '/dashboard/departments', icon: '🏢', roles: ['ADMIN'] },
    { name: 'Colleges', href: '/dashboard/colleges', icon: '🏛️', roles: ['ADMIN'] },
    { name: 'Roles', href: '/dashboard/roles', icon: '🔐', roles: ['ADMIN'] },
    { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: '📋', roles: ['ADMIN', 'AUDITOR'] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout, hasAnyRole } = useAuth();

    const visibleItems = navItems.filter(item => {
        if (!item.roles) return true;
        return hasAnyRole(...item.roles);
    });

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <span className={styles.logoIcon}>📚</span>
                <h1>UGC Record</h1>
            </div>

            <nav className={styles.nav}>
                {visibleItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                    >
                        <span className={styles.icon}>{item.icon}</span>
                        <span>{item.name}</span>
                    </Link>
                ))}
            </nav>

            <div className={styles.userSection}>
                <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className={styles.userDetails}>
                        <span className={styles.userName}>{user?.name}</span>
                        <span className={styles.userRole}>
                            {user?.roles?.filter(r => r)[0] || 'User'}
                        </span>
                        {user?.college_name && (
                            <span className={styles.collegeName}>{user?.college_name}</span>
                        )}
                    </div>
                </div>
                <button onClick={logout} className={styles.logoutBtn}>
                    🚪 Logout
                </button>
            </div>
        </aside>
    );
}
