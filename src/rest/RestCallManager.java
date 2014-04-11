package rest;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.Response;

import model.Car;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;

@Path("/sampleRest")
public class RestCallManager {
@POST
@Path("/add")
@Consumes("application/json")
public Response addCar(Car c1){
	ObjectifyService.register(Car.class);
	Objectify ofy = ObjectifyService.begin();
	ofy.put(c1);
	String output = "Car Id : " + c1.id;
	 
	return Response.status(200).entity(output).build();
}
}
