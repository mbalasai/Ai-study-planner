import { createClient } from '@insforge/sdk';

const insforge = createClient({
    baseUrl: 'https://ruhpkm82.ap-southeast.insforge.app',
    anonKey: 'ik_5fce0719a9b62daa9b0dc0c8d068dc2d'
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
