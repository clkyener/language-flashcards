# Language Learning Flashcards

A web application for learning languages through flashcards, featuring multiple language support (Swedish and German) and different proficiency levels (A1-C2).

## Features

- User Authentication (Email/Password and Google Sign-in)
- Multiple language support (Swedish and German)
- Six proficiency levels (A1-C2)
- Progress tracking and statistics
- Cloud data persistence
- Failed phrases tracking
- Daily study statistics

## Technologies Used

- React
- TypeScript
- Firebase (Authentication and Firestore)
- Vite
- Material-UI

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yenercelik/language-flashcards.git
cd language-flashcards
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
