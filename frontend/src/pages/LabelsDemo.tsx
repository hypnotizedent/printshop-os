import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PrintLabelButton, type JobLabelData } from '@/components/labels';
import { Package, Clock, User } from 'lucide-react';

export default function LabelsDemo() {
    // Sample job data
    const sampleJobs: JobLabelData[] = [
        {
            jobId: '12345',
            printavoId: '12345',
            customerName: 'Green School',
            jobNickname: 'Student T-shirts',
            quantity: 100,
            sizes: '25@S, 30@M, 30@L, 15@XL',
            dueDate: '2025-12-01',
            notes: 'Left chest print, 1 color black',
        },
        {
            jobId: '12346',
            printavoId: '12346',
            customerName: 'ABC Corporation',
            jobNickname: 'Employee Hoodies - Winter 2025',
            quantity: 250,
            sizes: '50@S, 75@M, 75@L, 40@XL, 10@2XL',
            dueDate: '2025-11-30',
            notes: 'Front logo + back text, 2 colors',
        },
        {
            jobId: '12347',
            printavoId: '12347',
            customerName: 'Local Sports Team',
            jobNickname: 'Game Day Jerseys',
            quantity: 30,
            sizes: '5@S, 10@M, 10@L, 5@XL',
            dueDate: '2025-11-28',
            notes: 'Rush order - DTG print',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <Package className="h-12 w-12 text-primary" />
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Job Labels
                        </h1>
                    </div>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Print professional 4×6 inch labels for your print jobs. Each label includes customer info, job details, and a QR code for easy tracking.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                        <Badge variant="secondary" className="text-sm px-4 py-2">
                            <Package className="h-4 w-4 mr-2" />
                            4×6 inch format
                        </Badge>
                        <Badge variant="secondary" className="text-sm px-4 py-2">
                            <Clock className="h-4 w-4 mr-2" />
                            Instant printing
                        </Badge>
                        <Badge variant="secondary" className="text-sm px-4 py-2">
                            <User className="h-4 w-4 mr-2" />
                            QR code tracking
                        </Badge>
                    </div>
                </div>

                {/* Sample Jobs Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sampleJobs.map((job) => (
                        <Card key={job.jobId} className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
                            <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="text-sm text-muted-foreground font-medium">
                                            Job #{job.printavoId}
                                        </div>
                                        <h3 className="font-bold text-lg leading-tight">
                                            {job.customerName}
                                        </h3>
                                    </div>
                                    <Badge variant="outline" className="font-mono">
                                        {job.quantity}pc
                                    </Badge>
                                </div>

                                {/* Job Details */}
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-foreground">
                                        {job.jobNickname}
                                    </p>
                                    {job.sizes && (
                                        <p className="text-xs text-muted-foreground">
                                            Sizes: {job.sizes}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Due: {new Date(job.dueDate).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Notes */}
                                {job.notes && (
                                    <div className="pt-2 border-t">
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {job.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Print Button */}
                                <PrintLabelButton
                                    job={job}
                                    variant="default"
                                    className="w-full"
                                />
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Feature Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                    <Card className="p-6 text-center space-y-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <Package className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold">Standard Size</h3>
                        <p className="text-sm text-muted-foreground">
                            4×6 inch labels fit standard label printers and adhesive sheets
                        </p>
                    </Card>

                    <Card className="p-6 text-center space-y-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <Clock className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold">Instant Preview</h3>
                        <p className="text-sm text-muted-foreground">
                            See exactly how your label will look before printing
                        </p>
                    </Card>

                    <Card className="p-6 text-center space-y-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <User className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-semibold">QR Tracking</h3>
                        <p className="text-sm text-muted-foreground">
                            Scan labels to instantly access job details on any device
                        </p>
                    </Card>
                </div>

                {/* Instructions */}
                <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
                    <h2 className="text-2xl font-bold mb-4">How to Use</h2>
                    <ol className="space-y-3 text-sm">
                        <li className="flex items-start gap-3">
                            <Badge className="shrink-0">1</Badge>
                            <span>Click "Print Label" on any job card above to preview the label</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Badge className="shrink-0">2</Badge>
                            <span>Review the label preview to ensure all details are correct</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Badge className="shrink-0">3</Badge>
                            <span>Click "Print" to open your browser's print dialog</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Badge className="shrink-0">4</Badge>
                            <span>Select your label printer or regular printer with 4×6 paper/labels</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <Badge className="shrink-0">5</Badge>
                            <span>Print and attach to your job packaging - done! 🎉</span>
                        </li>
                    </ol>
                </Card>
            </div>
        </div>
    );
}
