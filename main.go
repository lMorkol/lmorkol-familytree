package main

func main() {
	ConnectDatabase()         // Подключение к базе
	DB.AutoMigrate(&Person{}) // Создание таблицы

	r := SetupRouter() // Настройка роутов
	r.Run(":8080")     // Запуск сервера на порту 8080
}
