import axios from 'axios';
import moment from 'moment';
import { timezone, invoiceBoardId, redisUrl } from "../../../config";
import XeroHelper from "./Helpers/XeroHelper";
import MondayHelper from "./Helpers/MondayHelper";

const invoiceStatus = async (req, res) => {
    try {
        const date = moment().tz(timezone).subtract(1, 'days');
        let xeroHelper = new XeroHelper();
        let url = 'https://api.xero.com/api.xro/2.0/Invoices?';
        url += 'where=Type="ACCREC"';
        if (date) {
            url += 'AND SentToContact=true AND DueDate=DateTime(' + date.format('YYYY') + ', ' + date.format('MM') + ', ' + date.format('DD') + ')';
        }
        let invoices = await xeroHelper.getBills(url);
        if (invoices.length) {
            invoices.forEach(async (invoice) => {
                let mondayHelper = new MondayHelper();
                let columnsIdsQuery = `query {boards(ids: ${invoiceBoardId}) {columns {id title}}}`;
                let columnsIds = await mondayHelper.api(columnsIdsQuery);
                let invoiceId = columnsIds?.data?.boards?.length && columnsIds?.data?.boards[0]?.columns?.find(column => column.title == 'Invoice ID')?.id;
                let statusId = columnsIds?.data?.boards?.length && columnsIds?.data?.boards[0]?.columns?.find(column => column.title == 'Status')?.id;

                const invoiceIdCheckQuery = `query {items_by_column_values (board_id: ${invoiceBoardId}, column_id: \"${invoiceId}\", column_value: \"${invoice.InvoiceID}\") {id name state column_values {id value title text} }}`;
                let savedInvoice = await mondayHelper.api(invoiceIdCheckQuery);

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
                    const column = await mondayHelper.apisWithVaribales(updateQuery, variables);
                    console.log("Items updated on monday", invoice?.Contact?.Name)
                }
            });
        }
        res.send("Done")
    } catch (err) {
        console.log({ err })
        return res.status(403).json({ output: "The caller does not have permission" });
    }
};

export default invoiceStatus;