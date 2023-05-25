import base64 from 'base-64';
import { supabase } from "../../../../supabase";
import { timezone } from "../../../../config";

const moment = require('moment-timezone'); //moment-timezone

export const fetchSettings = async () => {
  console.log('fetching supabase settings')

  const { data, error } = await supabase
    .from('settings')
    .select()
    .eq('id', 1);

  console.log('Supabase settings', data)

  if (data) {
    return data[0];
  }
  return null;
};

const refreshApi = async (requestOptions) => {
  console.log('Refresh Api', requestOptions)
  const res = await fetch("https://identity.xero.com/connect/token", requestOptions);
  let response = await res.json()
  console.log('Refresh response', response)
  return response;
}

const refreshToken = async (settings) => {
  if (settings) {
    console.log('Calling reset token');
    var myHeaders = new Headers();
    myHeaders.append("Accept", "*");
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Authorization", "Basic " + base64.encode(process.env.NEXT_PUBLIC_XERO_CLIENT_ID + ":" + process.env.NEXT_PUBLIC_XERO_SECRET));

    var urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "refresh_token");
    urlencoded.append("refresh_token", settings.refresh_token);

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded,
    };

    const response = await refreshApi(requestOptions);

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
  }

}

export const getBills = async (url) => {
  let settings = await fetchSettings();
  if (settings) {
    settings = await refreshToken(settings);
  }
  let connectionHeaders = new Headers();
  connectionHeaders.append("Accept", "application/json");
  connectionHeaders.append("Content-Type", "application/json");
  connectionHeaders.append("Authorization", "Bearer " + settings.access_token);
  connectionHeaders.append("Xero-Tenant-Id", settings.tenant_id);
  let requestOptions = {
    method: 'GET',
    headers: connectionHeaders,
  };
  if (!url) {
    url = "https://api.xero.com/api.xro/2.0/Invoices?";
  }


  const response = await fetch(url, requestOptions)
    .then(res => res.json())
    .catch(error => console.log('error', error));
  if (response && response.Invoices) {
    return response.Invoices;
  }
  return [];

}

export const fetchContact = async (name, settings) => {
  let connectionHeaders = new Headers();
  connectionHeaders.append("Accept", "application/json");
  connectionHeaders.append("Content-Type", "application/json");
  connectionHeaders.append("Authorization", "Bearer " + settings.access_token);
  connectionHeaders.append("Xero-Tenant-Id", settings.tenant_id);
  let requestOptions = {
    method: 'GET',
    headers: connectionHeaders,
  };
  const response = await fetch('https://api.xero.com/api.xro/2.0/Contacts?where=name="' + name + '"', requestOptions)
    .then(res => res.json())
    .catch(error => console.log('error', error));

  if (response.Contacts && response.Contacts.length) {
    return response.Contacts[0];
  }
  return null;
}



export const createXeroInvoice = async (data) => {
  console.log("createXeroInvoice helper:  creating invoice on xero")
  let settings = data.settings;
  if (settings) {
    settings = await refreshToken(settings);
    let connectionHeaders = new Headers();
    connectionHeaders.append("Accept", "application/json");
    connectionHeaders.append("Content-Type", "application/json");
    connectionHeaders.append("Authorization", "Bearer " + settings.access_token);
    connectionHeaders.append("Xero-Tenant-Id", settings.tenant_id);
    let contact = await fetchContact(data?.element?.name, settings);
    console.log("Checking for existing contact: ", contact?.ContactID)
    let contactData;
    if (contact) {
      contactData = {
        ContactID: contact.ContactID,
        EmailAddress: data?.email,
      }
    } else {
      contactData = {
        name: data?.element?.name,
        EmailAddress: data?.email,
      }
    }

    let bodyData = {
      Invoices: [
        {
          Type: "ACCREC",
          Contact: contactData,
          LineItems: [
            {
              Description: data?.stage ? data?.stage : data?.element?.name,
              Quantity: 1,
              UnitAmount: data.amount,
              AccountCode: "200",
              TaxType: "NONE",
              LineAmount: data.amount
            }
          ],
          Date: data.date,
          DueDate: data.dueDate,
          Reference: data?.stage ? data?.stage : data?.element?.name,
          Status: "AUTHORISED",
          SentToContact: true,
        }
      ]
    };


    let requestOptions = {
      method: 'POST',
      headers: connectionHeaders,
      body: JSON.stringify(bodyData),
    };

    const response = await fetch('https://api.xero.com/api.xro/2.0/Invoices', requestOptions)
      .then(res => res.json())
      .catch(error => console.log('error', error));

    console.log("Created invoice response: ", response)

    return response
  } else {
    return null;
  }
}