import PageLayout from '@/Layouts/PageLayout';
import { Head } from '@inertiajs/react';
import React from 'react';

export default function HomePage({ auth }) {
    return (
        <PageLayout>
            <Head title="Welcome" />
            <div className="page-content">
                <div className="container mx-auto">

                </div>
            </div>
        </PageLayout>
    );
}
