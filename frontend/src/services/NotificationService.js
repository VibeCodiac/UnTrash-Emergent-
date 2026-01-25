// Push Notification Service for UnTrash Berlin

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

class NotificationService {
  constructor() {
    this.swRegistration = null;
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Initialize service worker and notifications
  async init() {
    if (!this.isSupported) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.swRegistration);
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // Check if notifications are enabled
  getPermissionStatus() {
    if (!this.isSupported) return 'unsupported';
    return Notification.permission; // 'granted', 'denied', or 'default'
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) {
      return { success: false, reason: 'unsupported' };
    }

    try {
      const permission = await Notification.requestPermission();
      return { 
        success: permission === 'granted', 
        permission 
      };
    } catch (error) {
      console.error('Permission request failed:', error);
      return { success: false, reason: 'error', error };
    }
  }

  // Subscribe to push notifications
  async subscribe(userId) {
    if (!this.swRegistration) {
      await this.init();
    }

    if (Notification.permission !== 'granted') {
      const result = await this.requestPermission();
      if (!result.success) return result;
    }

    try {
      // Get existing subscription or create new one
      let subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create a new subscription
        // Note: In production, you'd use VAPID keys from backend
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          // For demo, we'll use local notifications instead of server push
        });
      }

      // Save subscription to backend
      await fetch(`${API}/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          subscription: subscription ? subscription.toJSON() : null,
          device_type: this.getDeviceType()
        })
      });

      return { success: true, subscription };
    } catch (error) {
      console.error('Subscription failed:', error);
      // Fall back to local notifications
      return { success: true, local: true };
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(userId) {
    try {
      if (this.swRegistration) {
        const subscription = await this.swRegistration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      // Notify backend
      await fetch(`${API}/notifications/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId })
      });

      return { success: true };
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      return { success: false, error };
    }
  }

  // Show a local notification (when push isn't available or for immediate feedback)
  async showLocalNotification(title, options = {}) {
    if (!this.isSupported) return false;
    
    if (Notification.permission !== 'granted') {
      const result = await this.requestPermission();
      if (!result.success) return false;
    }

    try {
      // Use service worker to show notification if available
      if (this.swRegistration) {
        await this.swRegistration.showNotification(title, {
          body: options.body || '',
          icon: options.icon || '/logo192.png',
          badge: '/logo192.png',
          tag: options.tag || 'untrash-local',
          data: options.data || {},
          vibrate: [100, 50, 100],
          ...options
        });
      } else {
        // Fallback to basic Notification API
        new Notification(title, {
          body: options.body || '',
          icon: options.icon || '/logo192.png',
          tag: options.tag || 'untrash-local',
          ...options
        });
      }
      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }

  // Get device type for analytics
  getDeviceType() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'android';
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/windows/i.test(ua)) return 'windows';
    if (/macintosh/i.test(ua)) return 'mac';
    return 'other';
  }

  // Check if app is running as installed PWA
  isInstalledPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }
}

// Singleton instance
const notificationService = new NotificationService();
export default notificationService;
