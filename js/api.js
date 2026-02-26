const API_URL = 'https://serv-production-2768.up.railway.app/api/auth';

export async function authRequest(endpoint, payload) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Authentication failed');

        return data;
    } catch (err) {
        throw new Error(err.message);
    }
}