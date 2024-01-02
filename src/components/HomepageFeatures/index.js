import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Extensible',
    Image: require('@site/static/img/0x4.png').default,
    description: (
      <>
        Developers may extend and build upon PyroPets and Embers in an open and
        permissionless way.
      </>
    ),
  },
  {
    title: 'Deflationary',
    Image: require('@site/static/img/0x0.png').default,
    description: (
      <>
        100% of the MRX used as PYRO generation fees is burned and permanently
        destroyed.
      </>
    ),
  },
  {
    title: 'Open Source',
    Image: require('@site/static/img/0x6f.png').default,
    description: (
      <>
        PyroPets is an open source project, meaning anyone is allowed to view
        and use the sourcecode!
      </>
    ),
  },
];

function Feature({Image, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className='text--center'>
        <img src={Image} className={styles.featureSvg} />
      </div>
      <div className='text--center padding-horiz--md'>
        <Heading as='h3'>{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className='container'>
        <div className='row'>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
