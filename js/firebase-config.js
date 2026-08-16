// ============================================================
// КОНФИГУРАЦИЯ FIREBASE
// ============================================================
// 1. Зайдите на https://console.firebase.google.com
// 2. Создайте проект (бесплатно, план Spark)
// 3. Добавьте веб-приложение (значок «</>») — Firebase покажет
//    объект firebaseConfig ниже. Скопируйте свои значения сюда.
// 4. Включите в разделе Build:
//      - Authentication → Sign-in method → Email/Password
//      - Firestore Database → Create database (production mode)
// 5. Создайте одного пользователя в Authentication → Users
//    (например, admin@example.com) — это и будет вход в админку.
// 6. Скопируйте правила безопасности из файла firestore.rules
//    в Firestore → Rules и нажмите Publish.
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAVoIbxpfovnDby2wGE0nPFPTN3IRUXhwA",
  authDomain: "site-90063.firebaseapp.com",
  projectId: "site-90063",
  storageBucket: "site-90063.firebasestorage.app",
  messagingSenderId: "454985024518",
  appId: "1:454985024518:web:08aed4bd3db35762e12f87"
};

// Инициализация (используем совместимую (compat) сборку SDK —
// она подключается через <script> без сборщиков, что удобно
// для чистого статического сайта на GitHub Pages)
firebase.initializeApp(firebaseConfig);

// auth нужен только на страницах с админ-панелью; на публичных
// страницах (например, кабинет ученика) firebase-auth-compat.js
// не подключается, поэтому проверяем его наличие
const auth = firebase.auth ? firebase.auth() : null;
const db = firebase.firestore();
