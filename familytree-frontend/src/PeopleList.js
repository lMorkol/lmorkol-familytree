// src/PeopleList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PeopleList() {
  const [people, setPeople] = useState([]);  // Состояние для списка людей

  useEffect(() => {
    // Отправляем GET-запрос к серверу, чтобы получить список людей
    axios.get('http://localhost:8080/people')
      .then(response => {
        setPeople(response.data); // Сохраняем данные в состояние
      })
      .catch(error => {
        console.log('Ошибка при получении данных:', error);
      });
  }, []); // Пустой массив гарантирует выполнение запроса только при монтировании компонента

  return (
    <div>
      <h1>Список людей</h1>
      <ul>
        {people.map(person => (
          <li key={person.id}>
            {person.name} - {person.birthdate}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PeopleList;
