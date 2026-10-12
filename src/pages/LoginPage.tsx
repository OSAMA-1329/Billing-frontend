import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(3),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="login-page">
      <section className="login-story">
        <div className="brand-lockup login-brand">
          <span className="brand-mark" aria-hidden="true">B</span>
          <span><strong>Shop POS</strong><small>Billing workspace</small></span>
        </div>
        <div>
          <p className="login-overline">YOUR DAILY COUNTER</p>
          <h1>Run the shop.<br />Know the numbers.</h1>
          <p>Sales, stock, suppliers, and customer accounts in one clear workspace.</p>
        </div>
        <div className="login-tags"><span>Sales</span><span>Inventory</span><span>Reports</span></div>
      </section>
      <div className="login-form-side">
        <form
          onSubmit={handleSubmit(async (values) => {
            try {
              await login(values.email, values.password);
              toast.success('Welcome back');
              navigate('/');
            } catch {
              toast.error('Invalid email or password');
            }
          })}
          className="card"
        >
          <p className="eyebrow">Welcome back</p>
          <h2 className="login-title">Sign in</h2>
          <p className="login-subtitle">Use your team account to continue.</p>
          <div className="login-fields">
            <div>
              <label className="label" htmlFor="login-email">Email address</label>
              <input id="login-email" type="email" autoComplete="username" className="input" {...register('email')} />
              {errors.email && <p className="field-error" role="alert">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="login-password">Password</label>
              <input id="login-password" type="password" autoComplete="current-password" className="input" {...register('password')} />
              {errors.password && <p className="field-error" role="alert">{errors.password.message}</p>}
            </div>
            <button type="submit" className="btn-primary login-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
