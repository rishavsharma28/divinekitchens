import { useRouter } from 'next/router';
import { Auth, ThemeSupa } from '@supabase/auth-ui-react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'

import React, { useState } from 'react';
import {
    UserIcon,
    LockClosedIcon,
} from '@heroicons/react/24/outline'
import config from './api/config';
import Button from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import Router from 'next/router'

const Login = () => {
    const session = useSession()
    const supabase = useSupabaseClient()
    const router = useRouter();

    if (session) {
        router.push("/")
    }

    const [message, setMessage] = useState(false);

    // form validation rules
    const validationSchema = Yup.object().shape({
        email: Yup.string().required('Email is required'),
    });
    const formOptions = { resolver: yupResolver(validationSchema) };

    // get functions to build form with useForm() hook
    const { register, handleSubmit, reset, setError, formState } =
        useForm(formOptions);
    let { errors } = formState;

    async function onforgot(formd: any) {
        const { data, error } = await supabase.auth.resetPasswordForEmail(formd.email, {})
        if (!error) {
            setMessage(true)
        }
    }

    const onChange = async (e: any) => {
        setMessage(false)
    }
    return (
        <>
            <div className="container mx-auto lg:px-4 py-4 min-h-screen flex flex-col md:items-center md:justify-center">
                <div className={`min-w-full md:min-w-0 bg-white rounded-xl shadow-xl transform transition-all  transition shadow-md hover:shadow-2xl focus:shadow-2xl w-1/2`}>
                    <div className="px-4 py-4 md:px-12 md:py-12">
                        <form autoComplete="new-password" onSubmit={handleSubmit(onforgot)}>
                            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-gray-300`}>
                                <UserIcon className={`h-8 w-8 text-gray-700} text-gray-500}`} aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center ">
                                <div className="text-3xl font-medium text-gray-900">
                                    Forgotten Password ?
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-gray-400 text-sm block mt-4 inline-block text-left">Email Address</label>
                                    <input {...register('email')} onChange={onChange} type="email" className="rounded-md text-lg px-4 py-2  border border-gray-300 " autoComplete="new-password" placeholder="" />
                                    <div className=" text-rose-500 text-left">{errors?.email?.message}</div>
                                </div>
                                <div className="flex flex-col">
                                    <Button type="submit" shape="rounded" className=" font-medium rounded-lg text-lg px-4 py-2 text-white mt-4 border inline-block">
                                        Submit
                                    </Button>
                                    <a href="javascript:void(0);" className="mt-4 text-gray-400 text-sm" onClick={() => { Router.push('/login') }}>Already have an account?</a>
                                    {message ? (
                                        <span className=" text-neutral-900">Check your email for the password reset link</span>
                                    ) : (<></>)}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>

    )
}

export default Login
