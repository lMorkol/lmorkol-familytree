package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.GET("/people", GetPeople)
	r.POST("/people", CreatePerson)

	return r
}

func GetPeople(c *gin.Context) {
	var people []Person
	DB.Find(&people)
	c.JSON(http.StatusOK, people)
}

func CreatePerson(c *gin.Context) {
	var person Person
	if err := c.ShouldBindJSON(&person); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	DB.Create(&person)
	c.JSON(http.StatusOK, person)
}
