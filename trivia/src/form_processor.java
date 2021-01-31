import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/form_processor")
public class FormServlet extends HttpServlet {

    protected void doPost(HttpServletRequest request,
            HttpServletResponse response) throws ServletException, IOException {

        // read form fields
        String name = request.getParameter("name");
        String major = request.getParameter("major");
        String from = request.getParameter("from");
        String movie = request.getParameter("movie");
        String grade = request.getParameter("grade");
        String avatar = request.getParameter("avatar");

        // do some processing here...

        // get response writer
        PrintWriter writer = response.getWriter();

        // build HTML code
        String htmlRespone = "<html>";
        htmlRespone += "<h2>Thank you, " + name + "!<br/>";
        htmlRespone += "Your major is: " + major + "<br/>";
        htmlRespone += "Your hometown is: " + from + "<br/>";
        htmlRespone += "Your favorite movie is: " + movie + "<br/>";
        htmlRespone += "Your grade is: " + grade + "<br/>";
        htmlRespone += "And your avatar is: " + avatar + "</h2>";
        htmlRespone += "</html>";

        // return response
        writer.println(htmlRespone);

    }

}
