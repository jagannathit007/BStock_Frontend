import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const HeroSlider = () => {
  const slides = [
    {
      title: "Festival Flash Deals On iPhone Series!",
      subtitle: "Express delivery in 3–5 Days (EST)",
      highlight: "iPhone Series!"
    },
    {
      title: "Diwali Special Offers On iPhone Series!",
      subtitle: "Limited Stock – Grab Now!",
      highlight: "iPhone Series!"
    },
    {
      title: "Year-End Sale On iPhone Series!",
      subtitle: "Free Accessories with Every Purchase",
      highlight: "iPhone Series!"
    }
  ];

  return (
    <div className="relative w-full h-[320px] overflow-hidden mb-6 hidden md:block">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        // autoplay={{
        //   delay: 4000,
        //   disableOnInteraction: false,
        // }}
        // navigation={{
        //   nextEl: '.swiper-button-next',
        //   prevEl: '.swiper-button-prev',
        // }}
        pagination={{
          clickable: true,
          el: '.swiper-pagination',
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active',
        }}
        className="h-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="readyStockBanner h-full flex bg-gradient-to-r from-purple-600 to-pink-600">
              <div className="mx-5 md:mx-10 lg:mx-20">
                <h1
                  className="text-white text-3xl md:text-5xl lg:text-6xl font-bold leading-tight"
                  style={{ lineHeight: '1.2' }}
                >
                  {slide.title.split(' On ')[0]} <br />
                  On <span className="text-[#FFDF63]">{slide.highlight}</span>
                </h1>
                <p className="text-white mt-3 text-sm md:text-lg">
                  {slide.subtitle}
                </p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Pagination Dots */}
      <div className="swiper-pagination !bottom-4"></div>

      {/* Custom Styles for Pagination */}
      <style jsx>{`
        .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
          width: 10px;
          height: 10px;
          margin: 0 4px !important;
        }
        .swiper-pagination-bullet-active {
          background: #FFDF63;
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

export default HeroSlider;