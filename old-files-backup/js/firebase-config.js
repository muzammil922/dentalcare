// Firebase Configuration
// Replace with your own Firebase config
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase with error handling
try {
    // Check if Firebase is available
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        window.db = db;
        console.log('Firebase initialized successfully');
    } else {
        console.warn('Firebase not available, using local storage fallback');
        // Create a mock db object for local storage fallback
        window.db = {
            collection: (name) => ({
                add: (data) => {
                    const items = JSON.parse(localStorage.getItem(name) || '[]');
                    const newItem = { ...data, id: Date.now().toString() };
                    items.push(newItem);
                    localStorage.setItem(name, JSON.stringify(items));
                    return Promise.resolve({ id: newItem.id });
                },
                get: () => {
                    const items = JSON.parse(localStorage.getItem(name) || '[]');
                    return Promise.resolve({ docs: items.map(item => ({ data: () => item, id: item.id })) });
                },
                doc: (id) => ({
                    update: (data) => {
                        const items = JSON.parse(localStorage.getItem(name) || '[]');
                        const index = items.findIndex(item => item.id === id);
                        if (index !== -1) {
                            items[index] = { ...items[index], ...data };
                            localStorage.setItem(name, JSON.stringify(items));
                        }
                        return Promise.resolve();
                    },
                    delete: () => {
                        const items = JSON.parse(localStorage.getItem(name) || '[]');
                        const filteredItems = items.filter(item => item.id !== id);
                        localStorage.setItem(name, JSON.stringify(filteredItems));
                        return Promise.resolve();
                    }
                })
            })
        };
    }
} catch (error) {
    console.error('Error initializing Firebase:', error);
    // Fallback to local storage
    window.db = {
        collection: (name) => ({
            add: (data) => {
                const items = JSON.parse(localStorage.getItem(name) || '[]');
                const newItem = { ...data, id: Date.now().toString() };
                items.push(newItem);
                localStorage.setItem(name, JSON.stringify(items));
                return Promise.resolve({ id: newItem.id });
            },
            get: () => {
                const items = JSON.parse(localStorage.getItem(name) || '[]');
                return Promise.resolve({ docs: items.map(item => ({ data: () => item, id: item.id })) });
            },
            doc: (id) => ({
                update: (data) => {
                    const items = JSON.parse(localStorage.getItem(name) || '[]');
                    const index = items.findIndex(item => item.id === id);
                    if (index !== -1) {
                        items[index] = { ...items[index], ...data };
                        localStorage.setItem(name, JSON.stringify(items));
                    }
                    return Promise.resolve();
                },
                delete: () => {
                    const items = JSON.parse(localStorage.getItem(name) || '[]');
                    const filteredItems = items.filter(item => item.id !== id);
                    localStorage.setItem(name, JSON.stringify(filteredItems));
                    return Promise.resolve();
                }
            })
        })
    };
}
