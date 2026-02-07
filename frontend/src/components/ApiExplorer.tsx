"use client";

import React, { useState } from 'react';
import api from '../utils/api';

type Method = 'GET' | 'POST';
type Resource = 'users' | 'projects';

const ApiExplorer: React.FC = () => {
    const [resource, setResource] = useState<Resource>('users');
    const [method, setMethod] = useState<Method>('GET');
    const [body, setBody] = useState<string>('{\n  \n}');
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            let res;
            if (method === 'GET') {
                res = await api.get(`/${resource}`);
            } else {
                let parsedBody = {};
                try {
                    parsedBody = JSON.parse(body);
                } catch (e) {
                    throw new Error("Invalid JSON body");
                }
                res = await api.post(`/${resource}`, parsedBody);
            }
            setResponse(res.data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "An error occurred");
            if (err.response) {
                setResponse(err.response.data);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h1>API Explorer</h1>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Resource</label>
                    <select
                        value={resource}
                        onChange={(e) => setResource(e.target.value as Resource)}
                        style={{ padding: '8px', fontSize: '16px' }}
                    >
                        <option value="users">Users</option>
                        <option value="projects">Projects</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Method</label>
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as Method)}
                        style={{ padding: '8px', fontSize: '16px' }}
                    >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                        onClick={handleRun}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            backgroundColor: '#0070f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Running...' : 'Run Operation'}
                    </button>
                </div>
            </div>

            {method === 'POST' && (
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Request Body (JSON)</label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        style={{ width: '100%', height: '150px', fontFamily: 'monospace', padding: '10px' }}
                    />
                    <small style={{ color: '#666' }}>
                        {resource === 'users' ? 'Example: {"name": "John", "email": "john@example.com", "password": "123", "department": "CS"}' :
                            'Example: {"title": "New Project", "slug": "new-proj", "grant_amount": 1000, "duration": 12, "dept_id": "UUID_HERE"}'}
                    </small>
                </div>
            )}

            <div style={{ borderTop: '1px solid #ccc', paddingTop: '20px' }}>
                <h3>Response</h3>
                {error && <div style={{ color: 'red', marginBottom: '10px' }}>Error: {error}</div>}

                <div style={{
                    backgroundColor: '#f5f5f5',
                    padding: '15px',
                    borderRadius: '4px',
                    overflowX: 'auto',
                    minHeight: '100px'
                }}>
                    {response ? (
                        <pre style={{ margin: 0 }}>{JSON.stringify(response, null, 2)}</pre>
                    ) : (
                        <span style={{ color: '#888' }}>Run an operation to see results...</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApiExplorer;
