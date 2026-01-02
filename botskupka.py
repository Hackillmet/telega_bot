import telebot
from telebot import types
import requests
import json
import time

bot = telebot.TeleBot('7323340648:AAE7lhBy1XFbQ9vU0W8zrj1HKtOJJLQcP24')


# ================== КОМАНДА СТАРТ ==================
@bot.message_handler(commands=['start', 'main', 'hello'])
def main(message):
    welcome_text = f"""
👋 Привет, {message.from_user.first_name}!

Я — переходник в Telegram! Вот что я умею:

<b>Основные команды:</b>
/start - Начать общение
/inf - Информация о канале 
/channel - Ссылка на канал
    """
    bot.send_message(message.chat.id, welcome_text, parse_mode='html')


# ================== КОМАНДА /channel ==================
@bot.message_handler(commands=['channel', 'канал', 'ссылка'])
def channel_command(message):
    """
    ОТДЕЛЬНАЯ команда для отправки ссылки на канал
    Вызывается командой /channel или /канал или /ссылка
    """
    channel_link = "https://t.me/Skupka_app"  # Ваша ссылка

    markup = types.InlineKeyboardMarkup()
    btn = types.InlineKeyboardButton('📢 Перейти в канал', url=channel_link)
    markup.add(btn)

    response = f"""
📢 <b>Наш канал:</b>

🔗 {channel_link}

Подписывайтесь, чтобы быть в курсе всех новостей!
"""
    bot.send_message(
        message.chat.id,
        response,
        reply_markup=markup,
        parse_mode='html'
    )


# ================== КОМАНДА /inf (ОБНОВЛЕННАЯ) ==================
@bot.message_handler(commands=['inf', 'info', 'о_канале'])
def inf(message):
    """
    Краткая информация о канале
    """
    markup = types.InlineKeyboardMarkup(row_width=2)

    # Кнопки
    btn_channel = types.InlineKeyboardButton('📢 Перейти в канал', url='https://t.me/Skupka_app')
    btn_share = types.InlineKeyboardButton('📤 Поделиться',
                                           url=f'https://t.me/share/url?url=https://t.me/Skupka_app&text=Классный%20канал!')

    markup.add(btn_channel, btn_share)

    info_text = """
📋 <b>Информация о канале "Skupka_app40"</b>

🏷️ <b>Название:</b> Skupka_app40
👥 <b>Подписчики:</b> 1000+ (растёт каждый день!)
📊 <b>Статистика:</b> Активность высокая
🎯 <b>Тематика:</b> Скупка, продажа
📅 <b>Основан:</b> 2025 год

⭐ <b>Особенности:</b>
• Актуальные предложения
• Быстрые сделки
• Проверенный продовец
• Поддержка 24/7

🔗 <b>Ссылка:</b> https://t.me/Skupka_app
"""

    bot.send_message(
        message.chat.id,
        info_text,
        reply_markup=markup,
        parse_mode='html'
    )


# ================== ОБРАБОТКА ТЕКСТА ==================
@bot.message_handler()
def info(message):
    text = message.text.lower()

    if text == 'привет':
        bot.send_message(message.chat.id, f'👋 Привет, {message.from_user.first_name}! Рад тебя видеть!')

    elif text == 'id':
        user_info = f"""
<b>📊 Информация о вас:</b>
ID: <code>{message.from_user.id}</code>
Имя: {message.from_user.first_name}
Фамилия: {message.from_user.last_name or 'Не указана'}
Username: @{message.from_user.username or 'Не указан'}
        """
        bot.reply_to(message, user_info, parse_mode='html')

    else:
        # Если сообщение не распознано
        bot.reply_to(message, '🤔 Не совсем понял. Попробуй команду /start чтобы узнать что я умею.')


# ================== ЗАПУСК БОТА ==================
if __name__ == '__main__':
    print("=" * 50)
    print("🤖 Бот запущен и работает на сервере!")
    print("✅ Теперь он доступен для ВСЕХ пользователей")
    print("🔗 Команды работают у всех, а не только локально")
    print("=" * 50)

    # Убираем параметр timeout и добавляем обработку ошибок
    while True:
        try:
            bot.polling(none_stop=True, interval=0, timeout=20)
        except Exception as e:
            print(f"⚠️ Ошибка соединения: {e}")
            print("🔄 Перезапуск через 5 секунд...")
            time.sleep(5)