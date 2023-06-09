import moment from 'moment-timezone';
import { apisWithVaribales } from './Helpers/MondayHelper';
import { createXeroInvoice } from './Helpers/XeroHelper';
import {
  invoiceBoardId,
  mondayApiKey,
  redisUrl,
  timezone,
} from '../../../config';
import { supabase } from '../../../supabase';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
  runtime: 'edge', // this is a pre-requisite
  regions: ['iad1'], // only execute this function on iad1
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchInvoices() {
  const { data, error } = await supabase.from('settings').select().eq('id', 1);

  let settings: any = null;
  if (data) {
    settings = data[0];
  }

  let todayDate = moment().tz(timezone).format('YYYY-MM-DD');
  console.log(todayDate);
  let query = `query {items_by_column_values (board_id: ${invoiceBoardId}, column_id: \"invoice_sent\", column_value: \"${todayDate}\") {id name group { title } state column_values {id value title text} }}`;
  let mondayData = await fetch('https://api.monday.com/v2', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: mondayApiKey,
    },
    body: JSON.stringify({
      query: query,
    }),
  }).then((data) => data.json());

  let boardsData = mondayData.data.items_by_column_values.filter(
    (el: any) =>
      el.group.title == 'Final Deposit' ||
      el.group.title == 'Drawings Deposit' ||
      el.group.title == 'Production Deposit' ||
      el.group.title == 'Delivery Deposit' ||
      el.group.title == 'Stone Measure Deposit'
  );

  boardsData.forEach(async (element: any) => {
    console.log('Creating item on xero', element?.name);
    let todayDate = moment().tz(timezone).format('YYYY-MM-DD');
    const searchedValue = element.column_values.find(
      (el: any) => el.title == 'Invoice ID' && el.text == ''
    );
    const paymentValue = element.column_values.find(
      (el: any) => el.title == 'Payment' && el.text != 'CA'
    );

    if (searchedValue && paymentValue) {
      const dueDate = element.column_values.find(
        (el: any) => el.title == 'Due Date'
      );
      const amount = element.column_values.find(
        (el: any) => el.title == 'Amount'
      );
      const invoiceId = element.column_values.find(
        (el: any) => el.title == 'Invoice ID'
      );
      const statusId = element.column_values.find(
        (el: any) => el.title == 'Status'
      );
      const stageId = element.column_values.find(
        (el: any) => el.title == 'Stage'
      );
      const emailId = element.column_values.find(
        (el: any) => el.title == 'Email'
      );
      const customerId = element.column_values.find(
        (el: any) => el.title == 'Customer ID'
      );

      const xeroResponse = await createXeroInvoice({
        element: element,
        dueDate: dueDate.text ? dueDate.text : todayDate,
        date: todayDate,
        stage: stageId.text,
        amount: amount.text ? Number(amount.text) : 0,
        email: emailId.text ? emailId.text : '',
        settings,
      });
      console.log('Create Invoice response', xeroResponse);

      if (
        xeroResponse &&
        xeroResponse.Invoices &&
        xeroResponse.Invoices.length
      ) {
        let updateQuery =
          'mutation ($myBoardId:Int!, $myItemId:Int!, $myColumnValues:JSON!) { change_multiple_column_values(item_id:$myItemId, board_id:$myBoardId, column_values: $myColumnValues) { id }}';
        let variables = JSON.stringify({
          myBoardId: parseInt(invoiceBoardId),
          myItemId: parseInt(element.id),
          myColumnValues: `{\"${invoiceId.id}\" : \"${
            xeroResponse.Invoices[0].InvoiceID
          }\", \"${customerId.id}\" : \"${
            xeroResponse.Invoices[0].Contact.ContactID
          }\", \"${statusId.id}\" : \"Invoice Sent\", \"${
            dueDate.id
          }\" : \"${moment(xeroResponse.Invoices.DueDateString).format(
            'YYYY-MM-DD'
          )}\"}`,
        });
        const column = await apisWithVaribales(updateQuery, variables);
        console.log(column, 'Items updated on monday', element?.name);
      }
    } else {
      console.log(
        element?.name,
        ':- Invoice id already exists or Payment is CA'
      );
    }
  });

  await wait(10000);
  return;
}

export default (request: NextRequest, context: NextFetchEvent) => {
  context.waitUntil(fetchInvoices());

  return NextResponse.json({
    name: `Hello, from ${request.url} I'm now an Edge Function!`,
  });
};
