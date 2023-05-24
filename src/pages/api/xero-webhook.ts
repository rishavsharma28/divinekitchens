import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getBills } from "./Helpers/XeroHelper";
import { apisWithVaribales, api } from "./Helpers/MondayHelper";
import moment from "moment-timezone";
import { billBoardId, timezone, billGroupId } from "../../../config";
import { Readable } from 'stream';

export const config = {
    runtime: 'edge', // this is a pre-requisite
    regions: ['iad1'], // only execute this function on iad1
};
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const syncBills = async (req:any) => {
    const body = await req.json();
    const events = body.events;
    if (events && events.eventCategory == 'INVOICE'){
        const invoice_id = events.resourceId;
        let url = 'https://api.xero.com/api.xro/2.0/Invoices?';
        let type = 'ACCPAY';
        if (invoice_id){
          url += `IDs=${invoice_id}&`;
        }
        if (type){
          url += 'where=Type="ACCPAY"';
        }
       
        let invoices = await getBills(url);
        invoices.forEach(async(invoice:any) => {
            let columnsIdsQuery = `query {boards(ids: ${billBoardId}) {columns {id title}}}`;
            let columnsIds = await api(columnsIdsQuery);
         
            let amountId = columnsIds?.data?.boards?.length && columnsIds?.data?.boards[0]?.columns?.find(column => column.title == 'Amount')?.id;
            let statusId = columnsIds?.data?.boards?.length && columnsIds?.data?.boards[0]?.columns?.find(column => column.title == 'Status')?.id;
            let dueDateId = columnsIds?.data?.boards?.length && columnsIds?.data?.boards[0]?.columns?.find(column => column.title == 'Due Date')?.id;
            let xeroId = columnsIds?.data?.boards?.length && columnsIds?.data?.boards[0]?.columns?.find(column => column.title == 'Xero ID')?.id;
            let supplierId = columnsIds?.data?.boards?.length && columnsIds?.data?.boards[0]?.columns?.find(column => column.title == 'Supplier ID')?.id;
            let createQuery = `mutation { create_item (board_id: ${billBoardId}, group_id: ${billGroupId}, item_name: \"${invoice?.Contact?.Name}\") { id }}`;
    
            // check if invoice is already on monday
            const invoiceIdCheckQuery = `query {items_by_column_values (board_id: ${billBoardId}, column_id: \"${xeroId}\", column_value: \"${invoice.InvoiceID}\") {id name state column_values {id value title text} }}`;
            let savedInvoice = await api(invoiceIdCheckQuery);

            if (savedInvoice?.data?.items_by_column_values?.length == 0){
                const item = await api(createQuery);
                if (item?.data?.create_item?.id){
                    const id = item?.data?.create_item?.id;
                    let status = 'To Be Paid'
                    if (invoice.Status == 'PAID'){
                        status = 'Paid';
                    }
                    let updateQuery = "mutation ($myBoardId:Int!, $myItemId:Int!, $myColumnValues:JSON!) { change_multiple_column_values(item_id:$myItemId, board_id:$myBoardId, column_values: $myColumnValues) { id }}";
                    let variables = JSON.stringify({
                        myBoardId: parseInt(billBoardId),
                        myItemId: parseInt(id),
                        myColumnValues: `{\"${amountId}\" : \"${invoice.Total}\", \"${xeroId}\" : \"${invoice.InvoiceID}\", \"${statusId}\" : \"${status}\", \"${dueDateId}\" : \"${moment(invoice.DueDateString).format('YYYY-MM-DD')}\", \"${supplierId}\" : \"${invoice.Contact.ContactID}\"}`
                    });
                    
                    const column = await apisWithVaribales(updateQuery, variables);
                    console.log("Items created on monday", invoice?.Contact?.Name)
                }
            } else {
                const item = savedInvoice.data.items_by_column_values[0];
                const id = item?.id;
                let updateQuery = "mutation ($myBoardId:Int!, $myItemId:Int!, $myColumnValues:JSON!) { change_multiple_column_values(item_id:$myItemId, board_id:$myBoardId, column_values: $myColumnValues) { id }}";
                let status = 'Paid'
                if (invoice.Status !== 'PAID'){
                    status = 'To Be Paid';
                }
                let variables = JSON.stringify({
                    myBoardId: parseInt(billBoardId),
                    myItemId: parseInt(id),
                    myColumnValues: `{\"${amountId}\" : \"${invoice.Total}\", \"${xeroId}\" : \"${invoice.InvoiceID}\", \"${statusId}\" : \"${status}\", \"${dueDateId}\" : \"${moment(invoice.DueDateString).format('YYYY-MM-DD')}\", \"${supplierId}\" : \"${invoice.Contact.ContactID}\"}`
                });
                const column = await apisWithVaribales(updateQuery, variables);
                console.log("Items updated on monday", invoice?.Contact?.Name)
            }
            
        })
    }
    await wait(10000);
    return;
};


export default (request: NextRequest,  context: NextFetchEvent ) => {
    context.waitUntil(syncBills(request));

    return NextResponse.json({
        status: 200,
        data: request,
    });
};

