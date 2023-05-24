import { useEffect, useState } from 'react';
import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import RootLayout from '@/layouts/_root-layout';
import type {
    GetServerSideProps,
    InferGetServerSidePropsType,
} from 'next';
import base64 from 'base-64';
import { supabase } from "../../supabase"
import moment from "moment";
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { code } = context?.query;
    
    const createToken =  async(code) => {
        try {
            let myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
            myHeaders.append("Authorization", "Basic " + base64.encode(process.env.NEXT_PUBLIC_XERO_CLIENT_ID + ":" + process.env.NEXT_PUBLIC_XERO_SECRET ));
    
            let urlencoded = new URLSearchParams();
            urlencoded.append("grant_type", "authorization_code");
            urlencoded.append("code", code);
            urlencoded.append("redirect_uri", process.env.NEXT_PUBLIC_XERO_REDIRECT_URI);
            let requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: urlencoded,
            };
            const response = await fetch("https://identity.xero.com/connect/token", requestOptions)
                .then(response => response.json())
                .catch(error => console.log('error', error));
    
                console.log({response})
    
            let connectionHeaders = new Headers();
            connectionHeaders.append("Content-Type", "application/json");
            connectionHeaders.append("Authorization", "Bearer " + response.access_token);
            let newRequestOptions = {
                method: 'GET',
                headers: connectionHeaders,
            };
    
            const connectionResponse = await fetch("https://api.xero.com/connections", newRequestOptions)
            .then(response => response.json())
            .catch(error => console.log('error', error));

            console.log(connectionResponse)


            const { error } = await supabase
            .from('settings')
            .upsert({ 
                id: 1,
                access_token: response.access_token,
                refresh_token: response.refresh_token,
                tenant_id: connectionResponse[0].tenantId, 
                token_last_refreshed: moment().utc().format('YYYY-MM-DD HH:mm:ss')
            })

            if (error){
                
                console.log('Supabase error: ', error)
                return {
                    error: true,
                }
            }

            return {
                access_token: response.access_token,
                refresh_token: response.refresh_token,
                tenant_id: connectionResponse[0].tenantId,
            }
        } catch (error){
            console.log('Try catch', error)
            return {
                error: true,
            }
        }
    }
    let res = {};
    if (code){
        res = await createToken(code);
    }
    return {
        props: res,
    };
};

const EditPortfolioPage: NextPageWithLayout<
    InferGetServerSidePropsType<typeof getServerSideProps>
> = (props:any) => {
    const router = useRouter();
    const [notify, setNotify] = useState(true)
    useEffect(() => {
        if (props.access_token){
            if (notify){
                setNotify(false);
                // toast.success('Xero connected');
            }
            router.push('/');
        }
    }, [])

    return (
        <>
            <NextSeo
                title="Edit Portfolio"
                description=""
            />
            
            {props.access_token && <p className='text-center'>
                <b>Xero Connected</b>
            </p>}
            
            {props.error && <p className='text-center'>
                <b>Error while connecting xero</b>
            </p>}
            
        </>
    );
};

EditPortfolioPage.getLayout = function getLayout(page:any) {
    return <RootLayout>{page}</RootLayout>;
};

export default EditPortfolioPage;