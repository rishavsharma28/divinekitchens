import moment from 'moment';
import { timezone, invoiceBoardId } from "../../../config";
import { getBills } from "./Helpers/XeroHelper";
import { apisWithVaribales, api } from "./Helpers/MondayHelper";
import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
    runtime: 'edge', // this is a pre-requisite
    regions: ['iad1'], // only execute this function on iad1
};
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchInvoices() {
    try {
        const date = moment().tz(timezone).subtract(1, 'days');
        let url = 'https://api.xero.com/api.xro/2.0/Invoices?';
        url += 'where=Type="ACCREC"';
        if (date) {
            url += 'AND SentToContact=true AND DueDate=DateTime(' + date.format('YYYY') + ', ' + date.format('MM') + ', ' + date.format('DD') + ')';
        }
        let invoices = await getBills(url);
        if (invoices.length) {
            invoices.forEach(async (invoice:any) => {
                let columnsIdsQuery = `query {boards(ids: ${invoiceBoardId}) {columns {id title}}}`;
                let columnsIds = await api(columnsIdsQuery);
                let invoiceId = columnsIds?.data?.boards?.length && columnsIds?.data?.boards[0]?.columns?.find((column:any) => column.title == 'Invoice ID')?.id;
                let statusId = columnsIds?.data?.boards?.length && columnsIds?.data?.boards[0]?.columns?.find((column:any) => column.title == 'Status')?.id;

                const invoiceIdCheckQuery = `query {items_by_column_values (board_id: ${invoiceBoardId}, column_id: \"${invoiceId}\", column_value: \"${invoice.InvoiceID}\") {id name state column_values {id value title text} }}`;
                let savedInvoice = await api(invoiceIdCheckQuery);

                if (savedInvoice?.data?.items_by_column_values?.length) {
                    console.log(savedInvoice?.data?.items_by_column_values)
                    const item = savedInvoice.data.items_by_column_values[0];
                    const id = item?.id;
                    let updateQuery = "mutation ($myBoardId:Int!, $myItemId:Int!, $myColumnValues:JSON!) { change_multiple_column_values(item_id:$myItemId, board_id:$myBoardId, column_values: $myColumnValues) { id }}";
                    let status = 'Overdue'
                    let variables = JSON.stringify({
                        myBoardId: parseInt(invoiceBoardId),
                        myItemId: parseInt(id),
                        myColumnValues: `{\"${statusId}\" : \"${status}\"}`
                    });
                    const column = await apisWithVaribales(updateQuery, variables);
                    console.log("Items updated on monday", invoice?.Contact?.Name)
                }
            });
        }
    } catch (err) {
        console.log("The caller does not have permission");
    }
    await wait(10000);
    return;
};

export default (request: NextRequest,  context: NextFetchEvent ) => {
    
    context.waitUntil(fetchInvoices());

    return NextResponse.json({
        name: `Hello, from ${request.url} I'm now an Edge Function!`,
    });
};
