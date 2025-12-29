import WebApp from '@twa-dev/sdk';

export class TelegramIntegration {
    private isAvailable: boolean = false;
    private userData: any = null;

    constructor() {
        this.init();
    }

    private init(): void {
        // Проверяем, запущено ли приложение в Telegram
        if (typeof window !== 'undefined' && WebApp) {
            this.isAvailable = true;
            
            // Инициализируем WebApp
            WebApp.ready();
            
            // Получаем данные пользователя
            this.userData = WebApp.initDataUnsafe?.user;
            
            // Разворачиваем приложение на весь экран
            WebApp.expand();
            
            // Применяем тему Telegram
            this.applyTheme();
            
            console.log('Telegram WebApp инициализирован');
            console.log('Пользователь:', this.userData);
        } else {
            console.log('Приложение запущено вне Telegram');
        }
    }

    private applyTheme(): void {
        if (!this.isAvailable) return;

        const themeParams = WebApp.themeParams;
        
        // Применяем цвета темы Telegram к UI
        document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#000000');
        document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#aaaaaa');
        document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#4CAF50');
        document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#4CAF50');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
    }

    isInTelegram(): boolean {
        return this.isAvailable;
    }

    getUserData(): any {
        return this.userData;
    }

    getUserName(): string {
        if (!this.userData) return 'Игрок';
        
        return this.userData.first_name || this.userData.username || 'Игрок';
    }

    getUserId(): number | null {
        return this.userData?.id || null;
    }

    showMainButton(text: string, callback: () => void): void {
        if (!this.isAvailable) return;

        WebApp.MainButton.setText(text);
        WebApp.MainButton.show();
        WebApp.MainButton.onClick(callback);
    }

    hideMainButton(): void {
        if (!this.isAvailable) return;

        WebApp.MainButton.hide();
    }

    shareScore(score: number, text?: string): void {
        if (!this.isAvailable) return;

        const shareText = text || `Я проехал гонку за ${score} секунд! Попробуй обогнать меня! 🏎️`;
        
        // Открываем диалог выбора чата для отправки
        WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`);
    }

    hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'): void {
        if (!this.isAvailable) return;

        switch (type) {
            case 'light':
            case 'medium':
            case 'heavy':
                WebApp.HapticFeedback.impactOccurred(type);
                break;
            case 'success':
            case 'warning':
            case 'error':
                WebApp.HapticFeedback.notificationOccurred(type);
                break;
        }
    }

    close(): void {
        if (!this.isAvailable) return;

        WebApp.close();
    }
}

