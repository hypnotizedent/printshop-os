/**
 * Customer Landing Page
 * Public entry point for customers
 * Routes: / (root)
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  ShieldCheck, 
  Receipt, 
  Printer, 
  ArrowRight,
  Package,
  Truck,
  Search
} from 'lucide-react';

export function CustomerLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Printer className="text-primary-foreground" size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:inline">PrintShop OS</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/track" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Track Order
            </Link>
            <Link to="/login/customer">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link to="/designer">
              <Button size="sm">Start Designing</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Custom Apparel in{' '}
            <span className="text-primary">3 Days</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Design online, get instant quotes, and track your order every step of the way.
            Premium custom printing made simple.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/designer">
              <Button size="lg" className="gap-2">
                Start Designing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/track">
              <Button size="lg" variant="outline" className="gap-2">
                <Search className="h-4 w-4" /> Track Order
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-md">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Fast Turnaround</CardTitle>
                <CardDescription>
                  3-5 day production on most orders. Rush options available for when you need it faster.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Quality Guarantee</CardTitle>
                <CardDescription>
                  Premium materials and professional printing. 100% satisfaction or we'll make it right.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Instant Quotes</CardTitle>
                <CardDescription>
                  Know your price upfront. No hidden fees, no surprises. Transparent pricing always.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Design Your Product</h3>
              <p className="text-sm text-muted-foreground">
                Use our online designer or upload your artwork
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Get Instant Quote</h3>
              <p className="text-sm text-muted-foreground">
                See pricing immediately as you customize
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Place Your Order</h3>
              <p className="text-sm text-muted-foreground">
                Secure checkout with multiple payment options
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2">Track Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Real-time updates from production to your door
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Placeholder */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4 italic">
                  "Incredible turnaround time and quality. Our team shirts looked amazing and arrived right on schedule."
                </p>
                <p className="font-semibold">— Sarah M., Marketing Director</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4 italic">
                  "The online designer made it so easy to visualize our custom hoodies before ordering. Highly recommend!"
                </p>
                <p className="font-semibold">— James T., Event Coordinator</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Create your custom apparel today. No minimums, no hassle.
          </p>
          <Link to="/designer">
            <Button size="lg" className="gap-2">
              Start Designing <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Printer className="text-primary-foreground" size={18} />
                </div>
                <span className="font-bold">PrintShop OS</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional custom printing for businesses and individuals.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/designer" className="hover:text-foreground">T-Shirts</Link></li>
                <li><Link to="/designer" className="hover:text-foreground">Hoodies</Link></li>
                <li><Link to="/designer" className="hover:text-foreground">Hats</Link></li>
                <li><Link to="/designer" className="hover:text-foreground">More Products</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/track" className="hover:text-foreground flex items-center gap-1"><Package className="h-3 w-3" /> Track Order</Link></li>
                <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
                <li><Link to="/contact" className="hover:text-foreground">Contact Us</Link></li>
                <li><Link to="/shipping" className="hover:text-foreground flex items-center gap-1"><Truck className="h-3 w-3" /> Shipping Info</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/login/customer" className="hover:text-foreground">Customer Login</Link></li>
                <li><Link to="/login/employee" className="hover:text-foreground">Employee Login</Link></li>
                <li><Link to="/login/admin" className="hover:text-foreground">Admin Login</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} PrintShop OS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CustomerLanding;
