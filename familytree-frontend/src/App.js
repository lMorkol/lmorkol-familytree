import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Импортируем axios для отправки запросов

function App() {
  // Стейт для хранения данных о людях
  const [people, setPeople] = useState([]);

  // Функция для загрузки данных о людях с бэкенда
  useEffect(() => {
    // Запрос к API
    axios.get('http://localhost:8080/people')  // Убедись, что сервер работает на этом порту
      .then((response) => {
        // Обновляем стейт с полученными данными
        setPeople(response.data);
      })
      .catch((error) => {
        console.error("Ошибка при загрузке данных:", error);
      });
  }, []);

  return (
    <div className="App">
      <h1>Биологическое дерево</h1>
      <h2>Список людей</h2>
      <ul>
        {people.length > 0 ? (
          people.map((person) => (
            <li key={person.ID}>
              {person.name} {person.surname} - {person.age} лет
            </li>
          ))
        ) : (
          <p>Загружаются данные...</p>
        )}
      </ul>
    </div>
  );
}

export default App;
