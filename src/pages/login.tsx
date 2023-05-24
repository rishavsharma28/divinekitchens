import { useRouter } from 'next/router';

import React, { useState } from 'react';
import {
  LockClosedIcon,
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useAccessToken } from '@/lib/hooks/use-token';

const Login = () => {
  const router = useRouter();
  const { setAccessToken } = useAccessToken();

  // if (session) {
  //   router.push("/")
  // }

  const [errormessage, setErrorMessage] = useState<any>(null);
  // form validation rules
  const validationSchema = Yup.object().shape({
    otp: Yup.string().required('6 digit Code is required'),
    // email: Yup.string().required('Email is required'),
    // password: Yup.string().required('Password is required'),
  });
  const formOptions = { resolver: yupResolver(validationSchema) };

  // get functions to build form with useForm() hook
  const { register, handleSubmit, reset, setError, formState } =
    useForm(formOptions);
  let { errors } = formState;

  async function onlogin(formd: any) {
    // const { data, error } = await supabase.auth.signInWithPassword({
    //   email: formd.email,
    //   password: formd.password,
    // })
    let code = process.env.NEXT_PUBLIC_LOGIN_CODE
    if (code === formd.otp) {
      router.push("/")
      setAccessToken(true) 
    } else {
      setErrorMessage("Wrong OTP")
    }
  }

  return (
    // <div className="container mx-auto flex min-h-screen flex-col py-4 md:items-center md:justify-center lg:px-4">
    //   <div
    //     className={`w-1/2 min-w-full transform rounded-xl md:min-w-0`}
    //   >
    //     <div className="px-4 py-4 md:px-12 md:py-12">
    //       {!session ? (
    //         <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
    //       ) : (
    //         <p>Account page will go here.</p>
    //       )}
    //     </div>
    //   </div>
    // </div>


    <div className="container mx-auto lg:px-4 py-4 min-h-screen flex flex-col md:items-center md:justify-center">
      <div className={`min-w-full md:min-w-0 bg-white rounded-xl shadow-xl transform transition-all  transition shadow-md hover:shadow-2xl focus:shadow-2xl w-1/2`}>
        <div className="px-4 py-4 md:px-12 md:py-12 dark:bg-light-dark ">
          <form autoComplete="off" onSubmit={handleSubmit(onlogin)}>
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-gray-300 bg-gray-300`}>
              <LockClosedIcon className={`h-8 w-8 text-gray-700 text-gray-500`} aria-hidden="true" />
            </div>
            <div className="mt-3 text-center ">
              <div className="text-3xl font-medium dark:text-white-900">
                Log in
              </div>
              <p className="text-lg dark:text-gray-400">
                Login to your account
              </p>
              <div className="flex flex-col flex-1">
                <label className="dark:text-gray-400 text-sm block mt-4 inline-block text-left">6 Digit Code</label>
                <input
                  {...register('otp')}
                  type="text" className="rounded-md text-lg px-4 py-2  border border-gray-300 dark:bg-gray-700 dark:text-white" autoComplete=" q@w3$rer5$%^#" placeholder="enter code here" />
                <div className=" text-rose-500 text-left">{errors?.otp?.message}</div>

              </div>
              {/* <div className="flex flex-col flex-1">
                <label className="text-gray-400 text-sm block mt-4 inline-block text-left">Email Address</label>
                <input
                  {...register('email')}
                  type="email" className="rounded-md text-lg px-4 py-2  border border-gray-300 " autoComplete=" q@w3$rer5$%^#" placeholder="" />
                <div className=" text-rose-500 text-left">{errors?.email?.message}</div>

              </div>
              <div className="flex flex-col flex-1">
                <label className="text-gray-400 text-sm block mt-4 inline-block text-left">Password</label>
                <input
                  {...register('password')}
                  type="password" className="rounded-md text-lg px-4 py-2  border border-gray-300 inline-block" autoComplete=" q@w3$rer5$%^#" placeholder="" />
                <div className=" text-rose-500 text-left">{errors?.password?.message}</div>

              </div> */}
              <div className="flex flex-col">
                <Button type="submit" shape="rounded" className=" font-medium rounded-lg text-lg px-4 py-2 text-white mt-4 border inline-block">
                  Log in
                </Button>
                {/* <a href="javascript:void(0);" className="mt-4 text-gray-400 text-sm" onClick={() => { Router.push('/forgot-password') }}>Forgot your password?</a> */}
                {/* <a href="javascript:void(0);" className="mt-4 text-gray-400 text-sm" onClick={signup}>Sign Up</a> */}
                {errormessage ? (
                  <span className=" text-rose-500">Invalid login credentials</span>
                ) : (<></>)}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

  )
}

export default Login
