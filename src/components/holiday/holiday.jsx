import React from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EventIcon from '@mui/icons-material/Event';
import './holiday.css';

// Import all holiday images
import independenceDayImg from '../images/IndependenceDay.jpg';
import republicDayImg from '../images/RepublicDay.jpg';
import christmasImg from '../images/Christmas.avif';
import bhatriDitiyaImg from '../images/BhatriDitiya.jpeg';
import newYearImg from '../images/new-year-day.jpg';
import diwaliImg from '../images/Diwali.jpg';
import durgaPujaDashamiImg from '../images/DurgaPujaDashami.webp';
import durgaPujaImg from '../images/Durgapuja.webp';
import mayDayImg from '../images/May Day.jpg';
import goodFridayImg from '../images/GoodFriday.avif';
import poilaBaisakhImg from '../images/PoilaBaisakh.jpg';
import dolYatraImg from '../images/Dolyatra.jpg';

// Holiday descriptions for additional information
const holidayDescriptions = {
  'Bengali New Year': 'Poila Boishakh marks the first day of the Bengali calendar. It\'s celebrated with cultural programs, traditional food, and new clothes.',
  'Good Friday': 'A Christian holiday commemorating the crucifixion of Jesus Christ and his death at Calvary.',
  'May Day': 'International Workers\' Day, celebrating the achievements of workers worldwide.',
  'Independence Day / Janmashtami': 'A double celebration of India\'s independence and the birth of Lord Krishna.',
  'Maha Shasthi (Durgapuja)': 'The first day of Durga Puja, marking the welcome of Goddess Durga.',
  'Maha Saptami (Durgapuja)': 'The second day of Durga Puja celebrations.',
  'Maha Ashtami (Durgapuja)': 'The most important day of Durga Puja, featuring Kumari Puja.',
  'Maha Navami (Durgapuja)': 'The final day of worship during Durga Puja.',
  'Vijaya Dashami / Gandhi Jayanti': 'Celebrates the victory of good over evil and honors Mahatma Gandhi\'s birthday.',
  'Diwali / Kali Puja': 'Festival of lights and worship of Goddess Kali in Bengal.',
  'Bhatri Ditiya': 'Celebrates the bond between brothers and sisters.',
  'Christmas': 'Celebrates the birth of Jesus Christ with festivities and gift-giving.',
  'New Year Day': 'Marks the beginning of the new year in the Gregorian calendar.',
  'Republic Day': 'Celebrates the adoption of the Constitution of India.',
  'Dol Yatra': 'The festival of colors in Bengal, similar to Holi.',
};

const initialHolidays = [
  { id: '1', name: 'Bengali New Year', date: '2025-04-15', isSunday: false, image: poilaBaisakhImg },
  { id: '2', name: 'Good Friday', date: '2025-04-18', isSunday: false, image: goodFridayImg },
  { id: '3', name: 'May Day', date: '2025-05-01', isSunday: false, image: mayDayImg },
  { id: '4', name: 'Independence Day / Janmashtami', date: '2025-08-15', isSunday: false, image: independenceDayImg },
  { id: '5', name: 'Maha Shasthi (Durgapuja)', date: '2025-09-28', isSunday: false, image: durgaPujaImg },
  { id: '6', name: 'Maha Saptami (Durgapuja)', date: '2025-09-29', isSunday: false, image: durgaPujaImg },
  { id: '7', name: 'Maha Ashtami (Durgapuja)', date: '2025-09-30', isSunday: false, image: durgaPujaImg },
  { id: '8', name: 'Maha Navami (Durgapuja)', date: '2025-10-01', isSunday: false, image: durgaPujaImg },
  { id: '9', name: 'Vijaya Dashami / Gandhi Jayanti', date: '2025-10-02', isSunday: false, image: durgaPujaDashamiImg },
  { id: '10', name: 'Diwali / Kali Puja', date: '2025-10-20', isSunday: false, image: diwaliImg },
  { id: '11', name: 'Bhatri Ditiya', date: '2025-10-23', isSunday: false, image: bhatriDitiyaImg },
  { id: '12', name: 'Christmas', date: '2025-12-25', isSunday: false, image: christmasImg },
  { id: '13', name: 'New Year Day', date: '2026-01-01', isSunday: false, image: newYearImg },
  { id: '14', name: 'Republic Day', date: '2026-01-26', isSunday: false, image: republicDayImg },
  { id: '15', name: 'Dol Yatra', date: '2026-03-03', isSunday: false, image: dolYatraImg },
];

const useStyles = (theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  title: {
    marginBottom: theme.spacing(4),
    color: '#2d4150',
    textAlign: 'center',
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-5px)',
    },
  },
  dateChip: {
    marginBottom: theme.spacing(2),
    backgroundColor: '#f0f4f8',
    '& .MuiChip-icon': {
      color: '#3d5a80',
    },
  },
  holidayName: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    color: '#2d4150',
  },
  description: {
    color: '#6b7280',
    marginBottom: theme.spacing(2),
  },
});

const HolidayList = () => {
  const theme = useTheme();
  const classes = useStyles(theme);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getCardClassName = (holiday) => {
    let className = `${classes.card} card-with-bg`;
    if (holiday.image) {
      className += ' holiday-card-with-image';
    }
    return className;
  };

  const getCardStyle = (holiday) => {
    if (!holiday.image) return {};
    return {
      '--holiday-bg-image': `url(${holiday.image})`
    };
  };

  return (
    <Container maxWidth={false} className={classes.root}>
      <Typography variant="h3" component="h1">
        Holiday Calendar 2025-2026
      </Typography>

      <div className="holiday-grid">
        {initialHolidays
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map((holiday) => (
            <Card 
              key={holiday.id} 
              className={getCardClassName(holiday)} 
              elevation={0}
              style={getCardStyle(holiday)}
            >
              <CardContent>
                <div className="date-chip">
                  <EventIcon />
                  {formatDate(holiday.date)}
                </div>
                <Typography variant="h6" className="holiday-name">
                  {holiday.name}
                </Typography>
                <Typography variant="body2" className="holiday-description">
                  {holidayDescriptions[holiday.name] || 'A special holiday to celebrate and enjoy.'}
                </Typography>
              </CardContent>
            </Card>
          ))}
      </div>
    </Container>
  );
};

export default HolidayList;