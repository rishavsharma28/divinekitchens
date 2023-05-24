import { supabase } from "../../../supabase";
import base64 from 'base-64';
import { timezone } from "../../../config";
const moment = require('moment-timezone'); //moment-timezone

const refreshToken = async(settings) => {
    console.log("refreshing token", settings)
      
      if (settings) {
        console.log('Calling reset token');
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
        myHeaders.append("Authorization", "Basic " + base64.encode(process.env.NEXT_PUBLIC_XERO_CLIENT_ID + ":" + process.env.NEXT_PUBLIC_XERO_SECRET));
        console.log('NEXT_PUBLIC_XERO_CLIENT_ID', process.env.NEXT_PUBLIC_XERO_CLIENT_ID);
        console.log('NEXT_PUBLIC_XERO_SECRET', process.env.NEXT_PUBLIC_XERO_SECRET);
        var urlencoded = new URLSearchParams();
        urlencoded.append("grant_type", "refresh_token");
        urlencoded.append("refresh_token", settings.refresh_token);

        var requestOptions = {
          method: 'POST',
          headers: myHeaders,
          body: urlencoded,
        };

        console.log(urlencoded)

        const response = await fetch("https://identity.xero.com/connect/token", requestOptions)
          .then(response => response.json())
          .catch(error => console.log('error', error));

        console.log("refreshing token response", response)

        const time = moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss');
        const { error } = await supabase
          .from('settings')
          .upsert({
            id: 1,
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            token_last_refreshed: time
          })

        if (error) {
          console.log("supabase error on refresh", error)

          return {
            error: true,
          }
        } else {
          console.log("return response", {
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            token_last_refreshed: time,
            tenant_id: settings.tenant_id
          })

          return {
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            token_last_refreshed: time,
            tenant_id: settings.tenant_id
          };
        }
      } else {
        console.log('Calling reset else part');
        return null;
      }
      return null;
   
  }

const syncBills = async (req, res) => {

    console.log('fetching supabase settings')

    const { data, error } = await supabase
    .from('settings')
    .select()
    .eq('id', 1);

    console.log('Supabase settings', data)
    const settings = await refreshToken(data)
    res.send(settings)
    
};

export default syncBills;
