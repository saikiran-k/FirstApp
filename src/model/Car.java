package model;

import javax.persistence.Id;

import javax.persistence.Entity;

@Entity
public class Car {
public @Id Long id;
public String name;
public Car(String name){
	this.name = name;
}
}
