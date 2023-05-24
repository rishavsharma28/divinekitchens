/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { useDropzone } from 'react-dropzone';
import Button from '@/components/ui/button';
import { PDFIcon } from '@/components/icons/pdf-icon';

function PDFUploader(props: any) {
    const { setPdfFile, pdfFile } = props;
    const { getRootProps, getInputProps } = useDropzone({
        accept: { "application/pdf": [] },
        onDrop: (acceptedFiles: any) => {
            setPdfFile.setPdfFile(acceptedFiles[0]);
        },
    });

    return (
        <div className="rounded-lg border border-solid border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-light-dark sm:p-6">
            <div
                {...getRootProps({
                    className:
                        'border border-dashed relative border-gray-200 dark:border-gray-700 h-48 flex items-center justify-center rounded-lg',
                })}
            >
                <input {...getInputProps()} />
                {pdfFile.pdfFile ? (
                    <PDFIcon />
                ) : (
                    <div className="text-center">
                        <p className="mb-6 text-sm tracking-tighter text-gray-600 dark:text-gray-400">
                           Import CSV
                        </p>
                        <Button>CHOOSE FILE</Button>
                    </div>
                )
                }
            </div >
        </div >
    );
}
export default PDFUploader;
