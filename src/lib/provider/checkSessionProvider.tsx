// import { useSession } from "next-auth/react";
import Router from "next/router";
import { useEffect } from "react";

import React from 'react'
import { useRouter } from 'next/router';
import { useAccessToken } from '@/lib/hooks/use-token';

const CheckSessionProvider = () => {
    const router = useRouter()
    const { accessToken } = useAccessToken();

    useEffect(() => {
        if (router.pathname == '/login' || router.pathname == '/signup') {
        } else {
            if (accessToken == 'false' || accessToken == null) {
                Router.replace("/login");
            }
        }
    }, [accessToken]);

    return (
        <>
        </>
    )
}

export default CheckSessionProvider;
