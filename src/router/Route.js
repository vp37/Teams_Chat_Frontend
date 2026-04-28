import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import PrivateRoute from './PrivateRoute';
import Layout from '../layout/Layout';
import Chat from '../pages/Chat';
import Meet from '../pages/Meet';
import Teams from '../pages/Teams';
import Calendar from '../pages/Calendar';
import Activity from '../pages/Activity';
import Home from '../pages/Home';

const Router = () => {  
  const router = createBrowserRouter([
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/signup',
      element: <Signup />,
    },
    {
      path: '/',
      element: <PrivateRoute />,
      children: [
        {
          path: '/',
          element: <Layout />,
          children: [
            {
              path: '/chat',      
              element: <Chat />,
            },
            {
              path: '/meet',
              element: <Meet/>,
            },
            {
              path: '/teams',
              element: <Teams />,
            },
            {
              path: '/calendar',
              element: <Calendar />,
            },
            {
              path: '/activity',
              element: <Activity/>,
            },
             {
              path: '/', 
              element: <Home />,
            },
          ],
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};

export default Router;
