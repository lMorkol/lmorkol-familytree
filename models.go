package main

import "gorm.io/gorm"

type Person struct {
	gorm.Model
	Name      string `json:"name"`
	Birthdate string `json:"birthdate"`
	PhotoURL  string `json:"photo_url"`
	ParentID  *uint  `json:"parent_id"`
}
