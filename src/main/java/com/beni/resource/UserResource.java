package com.beni.resource;
import java.util.List;
import com.beni.entity.User;
import com.beni.repository.UserRepository;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.transaction.Transactional;


@Path("/users")
public class UserResource {

    @Inject
    UserRepository userRepository;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public User createUser(User user) {
        userRepository.persist(user);
        return user;
    }

    @GET
    public List<User> getAllUsers() {
        return userRepository.listAll();
    }
    @DELETE
    @Path("/{id}")
    @Transactional
    public void deleteUser(@PathParam("id") Integer id) {
        userRepository.deleteById(Long.valueOf(id));
    }
    public User updateUser(@PathParam("id") Integer id, User updatedUser) {

        User user = userRepository.findById(Long.valueOf(id));

        if (user != null) {
            user.fullName = updatedUser.fullName;
            user.phoneNumber = updatedUser.phoneNumber;
            user.email = updatedUser.email;
            user.role = updatedUser.role;
        }
        return user;
    }


    }