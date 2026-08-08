self.addEventListener('push', function (event) {
    if (!event.data) return;

    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: 'TPC e-Clinic', body: event.data.text() };
    }

    const title = data.title || 'TPC e-Clinic';
    const options = {
        body: data.body || '',
        icon: data.icon || '/images/tpc-logo.png',
        badge: '/images/self-logo-icon.png',
        data: data.data || {},
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
            const existing = clientsArr.find((c) => c.url.includes(self.location.origin));
            if (existing) return existing.focus();
            return clients.openWindow('/');
        })
    );
});
