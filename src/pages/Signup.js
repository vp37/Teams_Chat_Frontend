import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { toast, ToastContainer } from 'react-toastify';
import { signup } from '../component/axios/Servic';
import { signupSchema } from '../component/schema/Schema';
import style from '../component/css/Signup.module.css';

const Signup = () => {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
    },
    validationSchema: signupSchema,
    onSubmit: (values, { setSubmitting, setErrors }) => {
      signup({
        username: values.username,
        email: values.email,
        password: values.password,
        first_name: values.firstName,
        last_name: values.lastName,
        phone: values.phone,
      })
        .then((response) => {
          toast.success('Registration successful');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        })
        .catch((error) => {
          toast.error('Signup failed. Please try again.');
          setErrors({ username: 'Username or email already exists' });
        })
        .finally(() => setSubmitting(false));
    },
  });

  return (
    <div className={style.signupcontainer}>
      <div className={style.topheader}>
        <h1>Customer Registration</h1>
      </div>
      <form onSubmit={formik.handleSubmit}>
        {["firstName", "lastName", "username", "email", "phone", "password"].map((field) => (
          <div key={field}>
            <input
              type={field === "password" ? "password" : field === "email" ? "email" : "text"}
              placeholder={`Enter the ${field.charAt(0).toUpperCase() + field.slice(1)}`}
              name={field}
              value={formik.values[field]}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={formik.touched[field] && formik.errors[field] ? style.errorInput : ''}
            />
            {formik.touched[field] && formik.errors[field] && (
              <p className={style.errormsg}>{formik.errors[field]}</p>
            )}
          </div>
        ))}

        <button type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Registering..." : "Signup"}
        </button>

        <p className={style.loginRedirect}>
          Already have an account?{' '}
          <span onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: '#4a90e2' }}>
            Login here
          </span>
        </p>
      </form>
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar />
    </div>
  );
};

export default Signup;
