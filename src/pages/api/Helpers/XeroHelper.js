import base64 from 'base-64';
import { supabase } from "../../../../supabase";
import { timezone } from "../../../../config";

const moment = require('moment-timezone'); //moment-timezone

export default class XeroHelper {
  constructor() {

  }

  async fetchSettings() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/supabase/settings/single`).then(
      (res) => res.json()
    ).catch(error => console.log('Supabase error', error));
    if (response.data) {
      return response.data;
    }
    return null;
  };

  async refreshToken(settings) {
    try {

      if (settings) {
        var myHeaders = new Headers();
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

        const response = await fetch("https://identity.xero.com/connect/token", requestOptions)
          .then(response => response.json())
          .catch(error => console.log('error', error));

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
          return {
            error: true,
          }
        } else {
          return {
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            token_last_refreshed: time,
            tenant_id: settings.tenant_id
          };
        }
      }


    } catch (error) {
      console.log('Try catch', error)

      return {
        error: true,
      }
    }
  }

  async getBills(url) {
    let settings = await this.fetchSettings();
    if (settings) {
      settings = await this.refreshToken(settings);
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

  async fetchContact(name) {
    let settings = await this.fetchSettings();
    if (settings) {
      settings = await this.refreshToken(settings);
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
    const response = await fetch('https://api.xero.com/api.xro/2.0/Contacts?where=name="' + name + '"', requestOptions)
      .then(res => res.json())
      .catch(error => console.log('error', error));

    if (response.Contacts && response.Contacts.length) {
      return response.Contacts[0];
    }
    return null;
  }



  async createInvoice(data) {
    let settings = await this.fetchSettings();
    if (settings) {
      settings = await this.refreshToken(settings);
    }

    let connectionHeaders = new Headers();
    connectionHeaders.append("Accept", "application/json");
    connectionHeaders.append("Content-Type", "application/json");
    connectionHeaders.append("Authorization", "Bearer " + settings.access_token);
    connectionHeaders.append("Xero-Tenant-Id", settings.tenant_id);
    let contact = await this.fetchContact(data?.element?.name);
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
          Reference: "Website Design",
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
    return response
  }
}