package sample3;

import java.io.IOException;
import javax.servlet.http.*;

import model.Car;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;

@SuppressWarnings("serial")
public class Sample3Servlet extends HttpServlet {
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		resp.setContentType("text/plain");
		resp.getWriter().println("Hello, world");
		ObjectifyService.register(Car.class);
		Objectify ofy = ObjectifyService.begin();
		Car c1 = new Car("Ford");
		ofy.put(c1);
		resp.getWriter().println("Hello, "+ c1.id);
		resp.getWriter().println("Hello, world" + ofy.get(Car.class, c1.id).name);
	}
}
