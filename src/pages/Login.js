// Login.jsx

import React from "react";
import style from "../component/css/Login.module.css";
import { login } from "../component/axios/Servic"; // make sure login() calls the backend API
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { loginSchema } from "../component/schema/Schema"; // your Yup schema
import { useFormik } from "formik";
import "react-toastify/dist/ReactToastify.css";
import { setAuthToken, setAuthUser } from "../redux/AuthSlice"; // Redux actions to set auth token and user
import { useDispatch } from "react-redux";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: (values, { setSubmitting, setErrors }) => {
      login(values)
        .then((response) => {
          console.log("Login success:", response);
          const token = response.data.access_token; // ✅ correct key
          const userId = response.data.user_id;
          console.log(response.data.user_id);

          // Store token and username
          dispatch(setAuthToken(token));
          dispatch(setAuthUser({ id: userId, username: values.username }));

          // ✅ Store in localStorage (CRITICAL FIX)
          localStorage.setItem("token", token);

          toast.success("Login successfully");

          navigate("/"); // Navigate immediately
        })
        .catch((error) => {
          toast.error("Invalid username or password");
          setErrors({ password: "Invalid username or password" });
        })
        .finally(() => {
          setSubmitting(false);
        });
    },
  });

  return (
    <div className={style.logincontainer}>
      <form onSubmit={formik.handleSubmit}>
        <input
          type="text"
          id="username"
          name="username"
          placeholder="Username"
          value={formik.values.username}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={
            formik.touched.username && formik.errors.username
              ? style.errorInput
              : ""
          }
        />
        {formik.touched.username && formik.errors.username && (
          <p className={style.error}>{formik.errors.username}</p>
        )}

        <input
          type="password"
          id="password"
          name="password"
          placeholder="Password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={
            formik.touched.password && formik.errors.password
              ? style.errorInput
              : ""
          }
        />
        {formik.touched.password && formik.errors.password && (
          <p className={style.error}>{formik.errors.password}</p>
        )}

        <button type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Logging in..." : "Login"}
        </button>

        <div className={style.signUpPrompt}>
          Don't have an account?{" "}
          <span
            className={style.signUpLink}
            onClick={() => navigate("/signup")}
            style={{ cursor: "pointer" }}
          >
            Sign up
          </span>
        </div>
      </form>

      <ToastContainer position="top-center" autoClose={5000} hideProgressBar />
    </div>
  );
};

export default Login;


