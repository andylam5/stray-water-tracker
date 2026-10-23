import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PhoneFrame } from './components/PhoneFrame';
import { useDocumentLang } from './i18n';
import { ROUTES } from './lib/routes';
import Filled from './screens/Filled';
import FirstSip from './screens/FirstSip';
import Goal from './screens/Goal';
import Home from './screens/Home';
import Pour from './screens/Pour';
import Reminders from './screens/Reminders';
import Units from './screens/Units';
import Welcome from './screens/Welcome';
import WeeklyRead from './screens/WeeklyRead';

export default function App() {
  useDocumentLang();
  return (
    <BrowserRouter>
      <PhoneFrame>
        <Routes>
          <Route path={ROUTES.welcome} element={<Welcome />} />
          <Route path={ROUTES.units} element={<Units />} />
          <Route path={ROUTES.firstSip} element={<FirstSip />} />
          <Route path={ROUTES.pour} element={<Pour />} />
          <Route path={ROUTES.filled} element={<Filled />} />
          <Route path={ROUTES.goal} element={<Goal />} />
          <Route path={ROUTES.reminders} element={<Reminders />} />
          <Route path={ROUTES.weeklyRead} element={<WeeklyRead />} />
          <Route path={ROUTES.week} element={<WeeklyRead fromHome />} />
          <Route path={ROUTES.home} element={<Home />} />
          <Route path="*" element={<Navigate to={ROUTES.welcome} replace />} />
        </Routes>
      </PhoneFrame>
    </BrowserRouter>
  );
}
