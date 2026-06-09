import { createClient } from '@insforge/sdk';

const insforge = createClient({
    baseUrl: 'https://umbri88d.ap-southeast.insforge.app/',
    anonKey: 'ik_7db8414a43d1a0fcc88da13c3dabe2db'
});

async function testSignup() {
    console.log("Attempting signup...");
    const { data, error } = await insforge.auth.signUp({
        email: `testuser_${Date.now()}@example.com`,
        password: 'securepassword123',
        name: 'Test User'
    });

    if (error) {
        console.error("Signup failed:", error);
    } else {
        console.log("Signup succeeded!", data.user?.id);
    }
}

testSignup();
